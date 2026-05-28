#!/usr/bin/env python3
"""
Compliant TopCV crawler for AI-ready job posting datasets.

Scope:
- Uses only requests, BeautifulSoup4/lxml, and Python standard library.
- Respects robots.txt before fetching pages.
- Does not bypass Cloudflare, CAPTCHA, login walls, paywalls, or other access controls.
- Stops gracefully when blocked by HTTP 403, 429, 503, CAPTCHA, or Cloudflare challenge pages.
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
import time
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Iterable
from urllib import robotparser
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup, Tag
from requests import Response, Session
from requests.exceptions import RequestException, Timeout


BASE_URL = "https://www.topcv.vn/viec-lam"
ROBOTS_URL = "https://www.topcv.vn/robots.txt"
TOPCV_HOST = "www.topcv.vn"
OUTPUT_PATH = "data/topcv_jobs.json"

MAX_PAGES = 3
MAX_JOBS = 50
MIN_DELAY_SECONDS = 2.0
MAX_DELAY_SECONDS = 5.0
REQUEST_TIMEOUT_SECONDS = 25

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
]

BLOCKED_STATUS_CODES = {403, 429, 503}
BLOCKED_PAGE_MARKERS = (
    "Just a moment...",
    "Attention Required!",
    "cf-browser-verification",
    "challenges.cloudflare.com",
    "captcha",
    "g-recaptcha",
    "h-captcha",
)

NOISE_SELECTORS = (
    "script",
    "style",
    "iframe",
    "svg",
    "button",
    "form",
    "nav",
    "header",
    "footer",
    "aside",
)


class BlockedAccessError(RuntimeError):
    """Raised when the site returns a block/challenge/rate-limit response."""


@dataclass
class JobDocument:
    _id: str
    source: str
    source_url: str
    job_title: str
    description: str
    location: str
    category: str
    level: str
    salary: str
    text_for_embedding: str
    embedding: list[float]
    metadata: dict[str, object]
    crawled_at: str


def log(level: str, message: str) -> None:
    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    print(f"{timestamp} [{level.upper()}] {message}", flush=True)


def load_robots(user_agent: str) -> robotparser.RobotFileParser:
    """Load robots.txt. If unavailable, fail closed for safety."""
    parser = robotparser.RobotFileParser()
    parser.set_url(ROBOTS_URL)

    try:
        parser.read()
    except Exception as exc:
        raise RuntimeError(f"Could not load robots.txt from {ROBOTS_URL}: {exc}") from exc

    if not parser.can_fetch(user_agent, BASE_URL):
        raise RuntimeError(f"robots.txt disallows crawling {BASE_URL} for this user agent")

    log("info", f"robots.txt loaded and allows {BASE_URL}")
    return parser


def build_session() -> Session:
    session = requests.Session()
    session.headers.update(
        {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
            "Connection": "keep-alive",
            "Referer": "https://www.topcv.vn/",
        }
    )
    return session


def fetch_html(
    session: Session,
    url: str,
    robots: robotparser.RobotFileParser,
    user_agent: str,
    timeout_seconds: int = REQUEST_TIMEOUT_SECONDS,
) -> str | None:
    """Fetch HTML with robots and block detection."""
    if not robots.can_fetch(user_agent, url):
        log("warning", f"robots.txt disallows fetching: {url}")
        return None

    headers = {"User-Agent": random.choice(USER_AGENTS)}

    try:
        response = session.get(url, headers=headers, timeout=timeout_seconds)
        assert_not_blocked(response)
        response.raise_for_status()
        return response.text
    except BlockedAccessError:
        raise
    except Timeout:
        log("warning", f"Timeout while fetching {url}")
    except RequestException as exc:
        log("warning", f"HTTP request failed for {url}: {exc}")

    return None


def assert_not_blocked(response: Response) -> None:
    body_start = response.text[:10000]
    if response.status_code in BLOCKED_STATUS_CODES:
        raise BlockedAccessError(
            f"TopCV blocked or rate-limited the request with HTTP {response.status_code}. "
            "Stopping without attempting to bypass access controls."
        )

    marker = next((item for item in BLOCKED_PAGE_MARKERS if item.lower() in body_start.lower()), None)
    if marker:
        raise BlockedAccessError(
            f"TopCV returned an access-control/challenge page containing '{marker}'. "
            "Stopping without CAPTCHA or Cloudflare bypass."
        )


def build_page_url(page: int) -> str:
    """Build listing page URL for TopCV pagination."""
    if page <= 1:
        return BASE_URL

    parsed = urlparse(BASE_URL)
    query = dict(parse_qsl(parsed.query))
    query["page"] = str(page)
    return urlunparse(parsed._replace(query=urlencode(query)))


def extract_job_links_from_listing(html: str, page_url: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    links: list[str] = []

    selectors = [
        "a[href*='/viec-lam/']",
        "a[href*='/tuyen-dung/']",
        ".job-item a[href]",
        ".job-list-default a[href]",
        ".job-item-search-result a[href]",
        "[data-job-id] a[href]",
    ]

    for selector in selectors:
        for anchor in soup.select(selector):
            href = anchor.get("href")
            if not href:
                continue

            normalized = normalize_url(urljoin(page_url, href))
            if is_topcv_job_detail_url(normalized) and normalized not in links:
                links.append(normalized)

    return links


def is_topcv_job_detail_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.netloc and parsed.netloc != TOPCV_HOST:
        return False

    path = parsed.path
    return path.endswith(".html") and ("/viec-lam/" in path or "/tuyen-dung/" in path)


def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    return urlunparse(parsed._replace(query="", fragment=""))


def extract_job_detail(html: str, source_url: str) -> JobDocument | None:
    soup = BeautifulSoup(html, "lxml")
    remove_noise(soup)

    job_title = first_text(
        soup,
        [
            "h1.job-detail__info--title",
            "h1.job-detail-title",
            "h1",
            "meta[property='og:title']",
            "title",
        ],
    )
    job_title = clean_title(job_title)

    description = clean_description(soup)
    if not job_title or not description:
        log("warning", f"Skipping detail page with missing title/description: {source_url}")
        return None

    location = extract_labeled_value(soup, ["Địa điểm", "Khu vực", "Location"]) or "Không xác định"
    category = extract_labeled_value(soup, ["Ngành nghề", "Lĩnh vực", "Danh mục", "Category"]) or "Không xác định"
    level = extract_labeled_value(
        soup,
        ["Kinh nghiệm", "Cấp bậc", "Trình độ", "Experience", "Level"],
    ) or "Không xác định"
    salary = extract_labeled_value(soup, ["Mức lương", "Lương", "Salary"]) or "Thỏa thuận"
    crawled_at = datetime.now(timezone.utc).isoformat()

    return JobDocument(
        _id=str(uuid.uuid4()),
        source="topcv",
        source_url=source_url,
        job_title=job_title,
        description=description,
        location=location,
        category=category,
        level=level,
        salary=salary,
        text_for_embedding=build_text_for_embedding(
            job_title=job_title,
            description=description,
            location=location,
            category=category,
            level=level,
            salary=salary,
        ),
        embedding=[],
        metadata={
            "domain": "job_posting",
            "language": "vi",
            "crawler": "requests_beautifulsoup4",
            "ready_for_embedding": True,
        },
        crawled_at=crawled_at,
    )


def remove_noise(soup: BeautifulSoup) -> None:
    for node in soup.select(",".join(NOISE_SELECTORS)):
        node.decompose()

    noisy_class_pattern = re.compile(r"(navbar|header|footer|modal|popup|breadcrumb|ads?|banner)", re.I)
    for node in soup.find_all(class_=noisy_class_pattern):
        node.decompose()


def clean_text(value: str) -> str:
    value = unescape(value or "")
    value = value.replace("\xa0", " ")
    value = re.sub(r"[ \t\r\f\v]+", " ", value)
    value = re.sub(r"\n\s*\n\s*\n+", "\n\n", value)
    return value.strip()


def clean_description(soup: BeautifulSoup) -> str:
    description_nodes = find_description_nodes(soup)
    lines: list[str] = []

    for node in description_nodes:
        lines.extend(extract_semantic_lines(node))

    lines = dedupe_preserve_order([line for line in lines if line])
    return "\n".join(lines)


def find_description_nodes(soup: BeautifulSoup) -> list[Tag]:
    selectors = [
        ".job-description",
        ".job-description__item",
        ".job-detail__information-detail",
        ".job-detail__body",
        ".job-detail-content",
        "[class*='description']",
    ]

    for selector in selectors:
        nodes = [node for node in soup.select(selector) if looks_like_job_description(node)]
        if nodes:
            return nodes

    heading_pattern = re.compile(
        r"(Mô tả công việc|Yêu cầu ứng viên|Quyền lợi|Địa điểm làm việc|"
        r"Job description|Requirements|Benefits|Working location)",
        re.I,
    )
    nodes = []
    for text_node in soup.find_all(string=heading_pattern):
        parent = text_node.find_parent(["section", "article", "div"])
        if parent and looks_like_job_description(parent):
            nodes.append(parent)
    return nodes


def looks_like_job_description(node: Tag) -> bool:
    text = clean_text(node.get_text(" ", strip=True))
    if len(text) < 120:
        return False

    lowered = text.lower()
    keywords = [
        "mô tả công việc",
        "yêu cầu ứng viên",
        "quyền lợi",
        "địa điểm làm việc",
        "job description",
        "requirements",
        "benefits",
        "working location",
    ]
    return any(keyword in lowered for keyword in keywords)


def extract_semantic_lines(node: Tag) -> list[str]:
    lines: list[str] = []

    for br in node.find_all("br"):
        br.replace_with("\n")

    semantic_tags = node.find_all(["h2", "h3", "h4", "p", "li"])
    if not semantic_tags:
        raw_text = node.get_text("\n", strip=True)
        return [clean_text(line) for line in raw_text.splitlines() if clean_text(line)]

    for element in semantic_tags:
        text = clean_text(element.get_text(" ", strip=True))
        if not text:
            continue
        if element.name == "li" and not text.startswith(("-", "*")):
            text = f"- {text}"
        lines.append(text)

    return lines


def build_text_for_embedding(
    job_title: str,
    description: str,
    location: str,
    category: str,
    level: str,
    salary: str,
) -> str:
    parts = [
        f"Chức danh: {job_title}",
        f"Ngành nghề: {category}",
        f"Cấp bậc/Kinh nghiệm: {level}",
        f"Địa điểm: {location}",
        f"Lương: {salary}",
        "Nội dung công việc:",
        description,
    ]
    return "\n".join(clean_text(part) for part in parts if clean_text(part))


def extract_labeled_value(soup: BeautifulSoup, labels: list[str]) -> str:
    label_pattern = re.compile("|".join(re.escape(label) for label in labels), re.I)

    for text_node in soup.find_all(string=label_pattern):
        container = text_node.find_parent(["div", "li", "p", "span"])
        if not container:
            continue

        candidates = []
        candidates.append(container.get_text(" ", strip=True))
        candidates.extend(
            sibling.get_text(" ", strip=True)
            for sibling in container.find_next_siblings(["div", "span", "p", "li"], limit=3)
        )

        for candidate in candidates:
            value = strip_label(candidate, labels)
            if value:
                return value

    return ""


def strip_label(text: str, labels: list[str]) -> str:
    text = clean_text(text)
    for label in labels:
        value = re.sub(rf"^{re.escape(label)}\s*:?\s*", "", text, flags=re.I)
        value = clean_text(value.strip(" :-"))
        if value and value.lower() != label.lower() and len(value) <= 180:
            return value
    return ""


def first_text(soup: BeautifulSoup, selectors: Iterable[str]) -> str:
    for selector in selectors:
        node = soup.select_one(selector)
        if not node:
            continue
        if node.name == "meta":
            value = node.get("content", "")
        else:
            value = node.get_text(" ", strip=True)
        if value:
            return clean_text(value)
    return ""


def clean_title(title: str) -> str:
    title = clean_text(title)
    return re.sub(r"\s*-\s*TopCV.*$", "", title, flags=re.I)


def dedupe_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []

    for value in values:
        key = value.casefold()
        if key in seen:
            continue
        seen.add(key)
        output.append(value)

    return output


def save_json(jobs: list[JobDocument], output_path: str) -> None:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8") as file:
        json.dump([asdict(job) for job in jobs], file, ensure_ascii=False, indent=2)
        file.write("\n")

    log("info", f"Saved {len(jobs)} jobs to {path}")


def sleep_between_requests(min_delay: float, max_delay: float) -> None:
    delay = random.uniform(min_delay, max_delay)
    log("debug", f"Sleeping {delay:.2f}s")
    time.sleep(delay)


def crawl(
    max_pages: int = MAX_PAGES,
    max_jobs: int = MAX_JOBS,
    min_delay_seconds: float = MIN_DELAY_SECONDS,
    max_delay_seconds: float = MAX_DELAY_SECONDS,
    output_path: str = OUTPUT_PATH,
) -> list[JobDocument]:
    user_agent = USER_AGENTS[0]
    session = build_session()
    seen_urls: set[str] = set()
    jobs: list[JobDocument] = []

    try:
        robots = load_robots(user_agent)

        for page in range(1, max_pages + 1):
            if len(jobs) >= max_jobs:
                break

            page_url = build_page_url(page)
            log("info", f"Crawling listing page {page}/{max_pages}: {page_url}")
            listing_html = fetch_html(session, page_url, robots, user_agent)
            if not listing_html:
                continue

            job_links = extract_job_links_from_listing(listing_html, page_url)
            log("info", f"Found {len(job_links)} candidate job links on page {page}")

            if not job_links:
                log(
                    "warning",
                    "No job links found. The listing page may be JavaScript-rendered, "
                    "or TopCV may have changed its HTML. Use browser-rendered HTML or an "
                    "official API/export source if available. CAPTCHA/Cloudflare bypass is not implemented.",
                )
                break

            for source_url in job_links:
                if len(jobs) >= max_jobs:
                    break
                if source_url in seen_urls:
                    continue

                seen_urls.add(source_url)
                sleep_between_requests(min_delay_seconds, max_delay_seconds)
                log("info", f"Crawling job detail: {source_url}")

                detail_html = fetch_html(session, source_url, robots, user_agent)
                if not detail_html:
                    continue

                job = extract_job_detail(detail_html, source_url)
                if job:
                    jobs.append(job)
                    log("info", f"Extracted job {len(jobs)}/{max_jobs}: {job.job_title}")

            sleep_between_requests(min_delay_seconds, max_delay_seconds)

    except BlockedAccessError as exc:
        log("error", str(exc))
        log("error", "Crawler stopped gracefully. No bypass attempt was made.")
    except RuntimeError as exc:
        log("error", str(exc))
        log("error", "Crawler stopped gracefully for compliance. No pages were fetched.")
    finally:
        save_json(jobs, output_path)

    return jobs


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compliant TopCV job crawler.")
    parser.add_argument("--max-pages", type=int, default=MAX_PAGES)
    parser.add_argument("--max-jobs", type=int, default=MAX_JOBS)
    parser.add_argument("--min-delay", type=float, default=MIN_DELAY_SECONDS)
    parser.add_argument("--max-delay", type=float, default=MAX_DELAY_SECONDS)
    parser.add_argument("--output", default=OUTPUT_PATH)
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.max_pages < 1:
        log("error", "--max-pages must be >= 1")
        return 2
    if args.max_jobs < 1:
        log("error", "--max-jobs must be >= 1")
        return 2
    if args.min_delay < 0 or args.max_delay < args.min_delay:
        log("error", "--max-delay must be greater than or equal to --min-delay")
        return 2

    try:
        crawl(
            max_pages=args.max_pages,
            max_jobs=args.max_jobs,
            min_delay_seconds=args.min_delay,
            max_delay_seconds=args.max_delay,
            output_path=args.output,
        )
        return 0
    except KeyboardInterrupt:
        log("warning", "Interrupted by user. Exiting gracefully.")
        return 130


if __name__ == "__main__":
    sys.exit(main())
