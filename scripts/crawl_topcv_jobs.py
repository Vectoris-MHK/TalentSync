#!/usr/bin/env python3
"""
Crawl TopCV job postings into a MongoDB-ready JSON dataset.

The output keeps the fields needed by TalentSync's jobs collection and adds
metadata useful for deduplication and embedding generation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import random
import re
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Iterable
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup, Tag
from requests import Response, Session
from requests.exceptions import RequestException


BASE_URL = "https://www.topcv.vn/viec-lam"
TOPCV_DOMAIN = "www.topcv.vn"
DEFAULT_OUTPUT = "data/topcv_jobs.json"
REQUEST_TIMEOUT = 25

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
]

BLOCKED_MARKERS = (
    "Just a moment...",
    "cf-browser-verification",
    "challenges.cloudflare.com",
    "Attention Required!",
)


@dataclass
class JobDocument:
    job_title: str
    title: str
    description: str
    description_html: str
    location: str
    category: str
    level: str
    salary: int
    salary_text: str
    date: int
    visible: bool
    embedding: list[float]
    source: str
    source_id: str
    crawled_at: str


class TopCVCrawler:
    def __init__(
        self,
        max_pages: int,
        delay_min: float,
        delay_max: float,
        retries: int,
    ) -> None:
        self.max_pages = max_pages
        self.delay_min = delay_min
        self.delay_max = delay_max
        self.retries = retries
        self.session = self._build_session()
        self.seen_urls: set[str] = set()

    def _build_session(self) -> Session:
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

    def crawl(self) -> list[JobDocument]:
        jobs: list[JobDocument] = []

        for page in range(1, self.max_pages + 1):
            page_url = self._page_url(page)
            logging.info("Crawling listing page %s: %s", page, page_url)

            listing_html = self._get_html(page_url)
            if not listing_html:
                logging.warning("Skipping listing page %s because it could not be fetched", page)
                continue

            job_links = self._extract_job_links(listing_html, page_url)
            logging.info("Found %s job detail links on page %s", len(job_links), page)

            if not job_links:
                logging.warning("No job links found on page %s. Stopping pagination.", page)
                break

            for detail_url in job_links:
                if detail_url in self.seen_urls:
                    continue

                self.seen_urls.add(detail_url)
                self._respect_rate_limit()

                detail_html = self._get_html(detail_url)
                if not detail_html:
                    continue

                job = self._parse_job_detail(detail_html, detail_url)
                if job:
                    jobs.append(job)

            self._respect_rate_limit()

        return jobs

    def _page_url(self, page: int) -> str:
        if page <= 1:
            return BASE_URL

        parsed = urlparse(BASE_URL)
        query = dict(parse_qsl(parsed.query))
        query["page"] = str(page)
        return urlunparse(parsed._replace(query=urlencode(query)))

    def _get_html(self, url: str) -> str | None:
        last_error: Exception | None = None

        for attempt in range(1, self.retries + 1):
            headers = {"User-Agent": random.choice(USER_AGENTS)}
            try:
                response = self.session.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
                self._raise_for_blocked_response(response)
                response.raise_for_status()
                return response.text
            except RequestException as exc:
                last_error = exc
                if attempt >= self.retries:
                    break
                wait_seconds = min(30, (2**attempt) + random.uniform(0.5, 2.5))
                logging.warning(
                    "Request failed for %s on attempt %s/%s: %s. Retrying in %.1fs",
                    url,
                    attempt,
                    self.retries,
                    exc,
                    wait_seconds,
                )
                time.sleep(wait_seconds)

        logging.error("Giving up on %s after %s retries: %s", url, self.retries, last_error)
        return None

    def _raise_for_blocked_response(self, response: Response) -> None:
        body_start = response.text[:8000]
        if response.status_code in {403, 429} or any(marker in body_start for marker in BLOCKED_MARKERS):
            raise RequestException(
                f"TopCV returned an anti-bot or rate-limit response "
                f"(status={response.status_code}). Slow down or run from a browser-authenticated network."
            )

    def _extract_job_links(self, html: str, page_url: str) -> list[str]:
        soup = BeautifulSoup(html, "html.parser")
        links: list[str] = []

        selectors = [
            "a[href*='/viec-lam/']",
            "a[href*='/tuyen-dung/']",
            ".job-item a[href]",
            ".job-list-default a[href]",
            ".job-item-search-result a[href]",
        ]

        for selector in selectors:
            for anchor in soup.select(selector):
                href = anchor.get("href")
                if not href:
                    continue
                absolute = self._normalize_url(urljoin(page_url, href))
                if self._is_job_detail_url(absolute) and absolute not in links:
                    links.append(absolute)

        return links

    def _normalize_url(self, url: str) -> str:
        parsed = urlparse(url)
        return urlunparse(parsed._replace(query="", fragment=""))

    def _is_job_detail_url(self, url: str) -> bool:
        parsed = urlparse(url)
        if parsed.netloc and parsed.netloc != TOPCV_DOMAIN:
            return False
        path = parsed.path
        return (
            path.endswith(".html")
            and ("/viec-lam/" in path or "/tuyen-dung/" in path)
            and "ta_source" not in path
        )

    def _parse_job_detail(self, html: str, url: str) -> JobDocument | None:
        soup = BeautifulSoup(html, "html.parser")
        self._remove_noise(soup)

        title = self._first_text(
            soup,
            [
                "h1.job-detail__info--title",
                "h1.job-detail-title",
                "h1",
                "meta[property='og:title']",
                "title",
            ],
        )
        title = self._clean_title(title)

        if not title:
            logging.warning("Skipping %s because title was not found", url)
            return None

        description_html = self._extract_description_html(soup)
        description = self._html_to_semantic_text(description_html)

        if not description:
            logging.warning("Skipping %s because description was not found", url)
            return None

        salary_text = self._extract_field_by_labels(soup, ["Mức lương", "Lương", "Salary"])
        location = self._extract_field_by_labels(soup, ["Địa điểm", "Khu vực", "Location"])
        level = self._extract_field_by_labels(
            soup,
            ["Kinh nghiệm", "Cấp bậc", "Trình độ", "Experience", "Level"],
        )
        category = self._extract_field_by_labels(
            soup,
            ["Ngành nghề", "Lĩnh vực", "Danh mục", "Category"],
        )

        salary = self._parse_salary_to_vnd(salary_text)
        now = datetime.now(timezone.utc)

        return JobDocument(
            job_title=title,
            title=title,
            description=description,
            description_html=description_html,
            location=location or "Không xác định",
            category=category or "Không xác định",
            level=level or "Không xác định",
            salary=salary,
            salary_text=salary_text or "Thỏa thuận",
            date=int(now.timestamp() * 1000),
            visible=True,
            embedding=[],
            source=url,
            source_id=self._source_id(url),
            crawled_at=now.isoformat(),
        )

    def _remove_noise(self, soup: BeautifulSoup) -> None:
        for node in soup(["script", "style", "noscript", "iframe", "svg", "form", "button"]):
            node.decompose()

    def _first_text(self, soup: BeautifulSoup, selectors: Iterable[str]) -> str:
        for selector in selectors:
            node = soup.select_one(selector)
            if not node:
                continue
            if node.name == "meta":
                value = node.get("content", "")
            else:
                value = node.get_text(" ", strip=True)
            if value:
                return value
        return ""

    def _clean_title(self, title: str) -> str:
        title = self._normalize_space(title)
        return re.sub(r"\s*-\s*TopCV.*$", "", title, flags=re.IGNORECASE)

    def _extract_description_html(self, soup: BeautifulSoup) -> str:
        selectors = [
            ".job-description",
            ".job-description__item",
            ".job-detail__information-detail",
            ".job-detail__body",
            ".job-detail-content",
            "[class*='description']",
        ]

        nodes: list[Tag] = []
        for selector in selectors:
            nodes = [node for node in soup.select(selector) if self._looks_like_description(node)]
            if nodes:
                break

        if not nodes:
            nodes = self._sections_after_description_headings(soup)

        html_parts = [self._sanitize_rich_html(node) for node in nodes]
        return "\n".join(part for part in html_parts if part)

    def _looks_like_description(self, node: Tag) -> bool:
        text = node.get_text(" ", strip=True)
        if len(text) < 120:
            return False
        lowered = text.lower()
        keywords = [
            "mô tả công việc",
            "yêu cầu ứng viên",
            "quyền lợi",
            "cách thức ứng tuyển",
            "job description",
            "requirements",
            "benefits",
        ]
        return any(keyword in lowered for keyword in keywords)

    def _sections_after_description_headings(self, soup: BeautifulSoup) -> list[Tag]:
        headings = soup.find_all(
            string=re.compile(
                r"(Mô tả công việc|Yêu cầu ứng viên|Quyền lợi|Job description|Requirements|Benefits)",
                re.IGNORECASE,
            )
        )
        sections: list[Tag] = []
        for heading in headings:
            parent = heading.find_parent(["section", "div", "article"])
            if parent and self._looks_like_description(parent):
                sections.append(parent)
        return sections

    def _sanitize_rich_html(self, node: Tag) -> str:
        allowed_tags = {"p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "h2", "h3", "h4"}
        clone = BeautifulSoup(str(node), "html.parser")

        for tag in clone.find_all(True):
            if tag.name not in allowed_tags:
                tag.unwrap()
                continue
            tag.attrs = {}

        html = str(clone)
        html = re.sub(r"\n{3,}", "\n\n", html)
        return html.strip()

    def _html_to_semantic_text(self, html: str) -> str:
        soup = BeautifulSoup(html, "html.parser")

        for br in soup.find_all("br"):
            br.replace_with("\n")

        lines: list[str] = []
        for element in soup.find_all(["h2", "h3", "h4", "p", "li"]):
            text = self._normalize_space(element.get_text(" ", strip=True))
            if not text:
                continue
            if element.name == "li":
                text = f"- {text}"
            lines.append(text)

        if not lines:
            text = soup.get_text("\n", strip=True)
            lines = [self._normalize_space(line) for line in text.splitlines() if line.strip()]

        return "\n".join(self._dedupe_preserve_order(lines))

    def _extract_field_by_labels(self, soup: BeautifulSoup, labels: list[str]) -> str:
        label_pattern = re.compile("|".join(re.escape(label) for label in labels), re.IGNORECASE)

        for text_node in soup.find_all(string=label_pattern):
            container = text_node.find_parent(["div", "li", "p", "span"])
            if not container:
                continue

            candidates = [
                sibling.get_text(" ", strip=True)
                for sibling in container.find_next_siblings(["div", "span", "p"], limit=3)
            ]
            candidates.append(container.get_text(" ", strip=True))

            for candidate in candidates:
                value = self._label_value(candidate, labels)
                if value:
                    return value

        return ""

    def _label_value(self, text: str, labels: list[str]) -> str:
        text = self._normalize_space(text)
        for label in labels:
            value = re.sub(rf"^{re.escape(label)}\s*:?\s*", "", text, flags=re.IGNORECASE)
            value = value.strip(" :-")
            if value and value.lower() != label.lower() and len(value) <= 180:
                return value
        return ""

    def _parse_salary_to_vnd(self, salary_text: str) -> int:
        text = unescape(salary_text or "").lower()
        if not text or any(word in text for word in ["thoả thuận", "thỏa thuận", "negotiable", "cạnh tranh"]):
            return 0

        numbers = [float(num.replace(",", ".")) for num in re.findall(r"\d+(?:[,.]\d+)?", text)]
        if not numbers:
            return 0

        multiplier = 1
        if "triệu" in text or "trieu" in text or "million" in text:
            multiplier = 1_000_000
        elif "k" in text:
            multiplier = 1_000
        elif "usd" in text or "$" in text:
            multiplier = 25_000

        if len(numbers) >= 2:
            value = sum(numbers[:2]) / 2
        else:
            value = numbers[0]

        return int(value * multiplier)

    def _source_id(self, url: str) -> str:
        path = urlparse(url).path
        match = re.search(r"j(\d+)|/(\d+)\.html$", path)
        if match:
            return next(group for group in match.groups() if group)
        return hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]

    def _dedupe_preserve_order(self, values: list[str]) -> list[str]:
        seen: set[str] = set()
        result: list[str] = []
        for value in values:
            key = value.lower()
            if key not in seen:
                seen.add(key)
                result.append(value)
        return result

    def _normalize_space(self, value: str) -> str:
        return re.sub(r"\s+", " ", unescape(value or "")).strip()

    def _respect_rate_limit(self) -> None:
        time.sleep(random.uniform(self.delay_min, self.delay_max))


def write_json(documents: list[JobDocument], output_path: str) -> None:
    payload = [asdict(document) for document in documents]
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Crawl TopCV jobs into MongoDB-ready JSON.")
    parser.add_argument("--pages", type=int, default=3, help="Number of listing pages to crawl.")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help="Output JSON file path.")
    parser.add_argument("--delay-min", type=float, default=2.0, help="Minimum delay between requests.")
    parser.add_argument("--delay-max", type=float, default=5.0, help="Maximum delay between requests.")
    parser.add_argument("--retries", type=int, default=3, help="Retries per HTTP request.")
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"])
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=args.log_level, format="%(asctime)s %(levelname)s %(message)s")

    if args.delay_min < 0 or args.delay_max < args.delay_min:
        raise ValueError("--delay-max must be greater than or equal to --delay-min")

    crawler = TopCVCrawler(
        max_pages=args.pages,
        delay_min=args.delay_min,
        delay_max=args.delay_max,
        retries=args.retries,
    )
    documents = crawler.crawl()
    write_json(documents, args.output)
    logging.info("Wrote %s jobs to %s", len(documents), args.output)

    if not documents:
        logging.warning(
            "No jobs were written. If TopCV returns 403/Cloudflare, requests-based crawling is blocked "
            "from this network; rerun later, reduce request rate, or use an approved data source/export."
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
