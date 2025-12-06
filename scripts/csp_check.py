import os
import sys
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


REQUIRED_CSP_PARTS = [
    ("default-src", "'self'"),
    ("style-src", "'self'"),
    ("script-src", "'self'"),
]


def fail(msg: str) -> None:
    print(f"CSP CHECK FAILED: {msg}")
    sys.exit(1)


def warn(msg: str) -> None:
    print(f"CSP CHECK WARNING: {msg}")


def get(url: str) -> requests.Response:
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    return r


def parse_csp(csp: str) -> dict:
    parts = {}
    for directive in csp.split(';'):
        directive = directive.strip()
        if not directive:
            continue
        if ' ' in directive:
            name, value = directive.split(' ', 1)
        else:
            name, value = directive, ''
        parts[name.strip()] = value.strip()
    return parts


def main():
    base_url = os.environ.get("DEPLOY_URL")
    if not base_url:
        fail("DEPLOY_URL env var is not set")

    if not base_url.startswith("http"):
        base_url = "https://" + base_url

    # Normalize to no trailing slash
    base_url = base_url.rstrip('/')

    # 1) Fetch index and inspect CSP
    resp = get(base_url + "/")
    csp_header = resp.headers.get("Content-Security-Policy")

    if csp_header:
        policy = parse_csp(csp_header)
        # Minimal assertions
        for name, must_contain in REQUIRED_CSP_PARTS:
            if name not in policy or must_contain not in policy[name]:
                fail(f"CSP header missing or weak for {name}: {policy.get(name)}")
    else:
        # Check meta fallback
        soup = BeautifulSoup(resp.text, "html.parser")
        meta = soup.find("meta", attrs={"http-equiv": "Content-Security-Policy"})
        if not meta or not meta.get("content"):
            fail("No CSP header and no meta Content-Security-Policy found on page")
        policy = parse_csp(meta["content"])  # type: ignore[index]
        for name, must_contain in REQUIRED_CSP_PARTS:
            if name not in policy or must_contain not in policy[name]:
                fail(f"Meta CSP missing or weak for {name}: {policy.get(name)}")

    # 2) Verify stylesheets and scripts are same-origin and load with 200
    soup = BeautifulSoup(resp.text, "html.parser")

    origin = urlparse(base_url).netloc

    def check_asset(tag_name: str, attr: str):
        tags = soup.find_all(tag_name)
        for t in tags:
            href = t.get(attr)
            if not href:
                continue
            url = urljoin(base_url + '/', href)
            netloc = urlparse(url).netloc
            if netloc != origin:
                fail(f"{tag_name} references cross-origin resource: {url}")
            r = get(url)
            if r.status_code != 200:
                fail(f"{tag_name} failed to load: {url} -> {r.status_code}")

    check_asset("link", "href")  # stylesheets
    check_asset("script", "src")  # scripts

    # 3) Basic fetch of common assets emitted by Vite (optional best-effort)
    # Try to locate a CSS asset named index-*.css
    links = [l.get("href") for l in soup.find_all("link") if l.get("href")]
    css_links = [u for u in links if u.endswith('.css')]
    if not css_links:
        warn("No CSS links found on index page")
    else:
        for u in css_links:
            url = urljoin(base_url + '/', u)
            get(url)

    print("CSP CHECK PASSED: CSP present and assets load from same origin with 200 status")


if __name__ == "__main__":
    main()
