#!/usr/bin/env python3
"""
Populate the MCPress database with news articles from a list of URLs.

Calls the backend API to extract content from each URL and save it to the database.
Requires the backend to be running (e.g. uvicorn app.main:app --reload).

Usage:
    python scripts/populate_articles.py
    BACKEND_URL=http://localhost:8000 python scripts/populate_articles.py

Environment:
    BACKEND_URL  Base URL of the backend API (default: http://localhost:8000)
    DELAY_SECS   Seconds to wait between articles (default: 2, set 0 to disable)
"""

import os
import sys
import time
from typing import Any

import httpx

# Default backend URL
DEFAULT_BACKEND_URL = "http://localhost:8000"
API_PREFIX = "/api/v1"

# Super-recent links pulled on 2026-01-30 (America/New_York)
NEWS_LINKS = {
    "tech": [
        "https://www.reuters.com/business/videogame-stocks-slide-googles-ai-model-that-turns-prompts-into-playable-worlds-2026-01-30/",
        "https://www.reuters.com/legal/transactional/tesla-jumps-spacex-merger-talks-fuel-musk-empire-consolidation-hopes-2026-01-30/",
        "https://www.theverge.com/ai-artificial-intelligence/870889/rabbit-announced-a-new-ai-device-and-updates-to-r1",
        "https://www.theverge.com/tech/869975/nothing-phone-4-not-releasing-2026-flagship",
        "https://techcrunch.com/2026/01/30/russian-hackers-breached-polish-power-grid-thanks-to-bad-security-report-says/",
        "https://www.theverge.com/news/870663/microsoft-windows-11-top-menu-bar-powertoy-experiment",
    ],
    "business": [
        "https://www.reuters.com/business/energy/exxon-says-it-has-technology-needed-venezuelas-high-cost-crude-2026-01-30/",
        "https://www.reuters.com/business/wall-street-futures-fall-trump-set-announce-fed-chair-pick-2026-01-30/",
        "https://www.reuters.com/business/wall-st-week-ahead-heavy-earnings-week-jobs-data-test-us-stocks-after-microsoft-2026-01-30/",
        "https://www.reuters.com/business/global-markets-flows-graphic-2026-01-30/",
        "https://www.reuters.com/world/us/us-producer-prices-accelerate-december-services-2026-01-30/",
        "https://www.ft.com/content/18784bcd-e812-4ec9-8e7c-cb84c750f32c",
    ],
    "sports": [
        "https://www.reuters.com/sports/vonn-crashes-crans-montana-downhill-2026-01-30/",
        "https://www.reuters.com/sports/tennis/djokovic-sets-up-alcaraz-showdown-australian-open-title-2026-01-30/",
        "https://www.reuters.com/sports/tennis/miracle-man-alcaraz-beats-leg-issue-zverev-make-australian-open-final-2026-01-30/",
        "https://www.reuters.com/legal/litigation/americans-expected-bet-176-billion-super-bowl-aga-says-2026-01-30/",
        "https://www.reuters.com/sports/soccer/man-uniteds-dorgu-faces-weeks-sidelines-after-injury-arsenal-carrick-says-2026-01-30/",
        "https://africa.espn.com/nba/recap?gameId=401810539",
    ],
}


def get_backend_url() -> str:
    """Backend base URL from env or default."""
    return os.environ.get("BACKEND_URL", DEFAULT_BACKEND_URL).rstrip("/")


def get_delay_secs() -> float:
    """Delay between articles from env or default (0 to disable)."""
    try:
        return max(0.0, float(os.environ.get("DELAY_SECS", "2")))
    except ValueError:
        return 2.0


def extract_article(client: httpx.Client, base_url: str, url: str) -> dict[str, Any] | None:
    """Call POST /articles/extract and return response JSON or None on error."""
    try:
        r = client.post(
            f"{base_url}{API_PREFIX}/articles/extract",
            json={"url": url},
            timeout=120.0,
        )
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        print(f"  [extract] HTTP error: {e.response.status_code} - {e.response.text[:200]}")
        return None
    except httpx.RequestError as e:
        print(f"  [extract] Request error: {e}")
        return None


def save_article(
    client: httpx.Client,
    base_url: str,
    url: str,
    category: str,
    extracted: dict[str, Any],
) -> bool:
    """Build SaveRequest from extracted data and call POST /articles/save. Returns True on success."""
    data = extracted.get("data") or {}
    payload = {
        "url": url,
        "title": data.get("title", "Untitled"),
        "author": data.get("author"),
        "published_date": data.get("published_date"),
        "content": data.get("content", ""),
        "summary": data.get("summary", ""),
        "keywords": data.get("keywords", []),
        "category": category,
        "organization": None,
        "image_url": None,
    }
    try:
        r = client.post(
            f"{base_url}{API_PREFIX}/articles/save",
            json=payload,
            timeout=60.0,
        )
        r.raise_for_status()
        return True
    except httpx.HTTPStatusError as e:
        print(f"  [save] HTTP error: {e.response.status_code} - {e.response.text[:200]}")
        return False
    except httpx.RequestError as e:
        print(f"  [save] Request error: {e}")
        return False


def main() -> int:
    base_url = get_backend_url()
    print(f"Backend: {base_url}")
    print("Checking health...")
    try:
        r = httpx.get(f"{base_url}/health", timeout=10.0)
        r.raise_for_status()
    except Exception as e:
        print(f"Cannot reach backend: {e}")
        print("Start the backend first, e.g.: uvicorn app.main:app --reload")
        return 1
    print("OK\n")

    total = sum(len(urls) for urls in NEWS_LINKS.values())
    ok = 0
    failed = 0
    delay = get_delay_secs()
    if delay > 0:
        print(f"Delay between articles: {delay}s\n")

    with httpx.Client() as client:
        for category, urls in NEWS_LINKS.items():
            print(f"Category: {category} ({len(urls)} URLs)")
            for i, url in enumerate(urls, 1):
                short = url[:60] + "..." if len(url) > 60 else url
                print(f"  [{i}/{len(urls)}] {short}")
                extracted = extract_article(client, base_url, url)
                if not extracted:
                    failed += 1
                    if delay > 0:
                        time.sleep(delay)
                    continue
                if save_article(client, base_url, url, category, extracted):
                    ok += 1
                    print(f"    -> saved")
                else:
                    failed += 1
                if delay > 0:
                    time.sleep(delay)
            print()

    print(f"Done: {ok} saved, {failed} failed (total {total})")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
