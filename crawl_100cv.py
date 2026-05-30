from selenium import webdriver
from selenium.webdriver.firefox.service import Service
import undetected_chromedriver as uc
import requests
import json
import time

service = Service(r"C:\Tool\geckodriver\geckodriver.exe")

driver = uc.Chrome(version_main=148)

driver.get("https://www.topcv.vn/viec-lam")

time.sleep(15)

# Lấy cookie từ Chrome
cookies = driver.get_cookies()

print("\n===== CHROME COOKIES =====")
for cookie in cookies:
    print(cookie["name"])

session = requests.Session()

for cookie in cookies:
    session.cookies.set(
        cookie["name"],
        cookie["value"]
    )

print("\n===== REQUESTS COOKIES =====")
for c in session.cookies:
    print(c.name)

xsrf = session.cookies.get("XSRF-TOKEN")

print("\n===== XSRF TOKEN =====")
print(xsrf)

headers = {
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json;charset=UTF-8",
    "origin": "https://www.topcv.vn",
    "referer": "https://www.topcv.vn/viec-lam",
    "x-xsrf-token": xsrf
}

payload = {
    "page": 1,
    "limit": 20,
    "city": 0,
    "salary": None,
    "exp": None,
    "category": None
}

response = session.post(
    "https://www.topcv.vn/api-featured-jobs",
    headers=headers,
    json=payload
)

print("\n===== RESPONSE =====")
print("Status:", response.status_code)
print("Content-Type:", response.headers.get("content-type"))
print(response.text[:1000])

# Chỉ parse JSON nếu thành công
if response.status_code == 200:
    try:
        data = response.json()

        jobs = []

        for job in data.get("jobs", []):
            jobs.append({
                "title": job.get("title"),
                "description": job.get("job_description"),
                "location": job.get("short_cities"),
                "category": job.get("type"),
                "level": job.get("experience"),
                "salary": job.get("salary"),
                "visible": True
            })

        print(json.dumps(
            jobs,
            ensure_ascii=False,
            indent=2
        ))

    except Exception as e:
        print("JSON ERROR:", e)

driver.quit()