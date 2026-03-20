import requests
import pandas as pd
import json
import time
import re

BASE_URL = "https://backend.delhimetrorail.com/api/v2/en/station_by_keyword/all"

HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://www.delhimetrorail.com/"}

CACHE_FILE = "station_codes.json"


def load_cache():
    try:
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    except:
        return {}


def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)


def clean_station_name(name: str) -> str:
    name = name.strip().strip('"').strip("'")
    name = re.sub(r"\[.*?\]", "", name)
    return name.strip()


def normalize(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())


def fetch_station_code(query):
    url = f"{BASE_URL}/{query.lower()}"
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        if res.status_code == 200:
            return res.json()
    except:
        return []
    return []


def build_mapping(csv_path):
    df = pd.read_csv(csv_path)
    cache = load_cache()

    for raw_station in df["Station Name"].unique():
        if "(" in raw_station:
            continue

        station = clean_station_name(raw_station)

        if not station or station in cache:
            continue

        results = fetch_station_code(station)

        best_code = None
        for r in results:
            if normalize(r["station_name"]) == normalize(station):
                best_code = r["station_code"]
                break

        if best_code:
            cache[station] = best_code
            print(f"{station} -> {best_code}")

        time.sleep(0.3)

    save_cache(cache)


if __name__ == "__main__":
    build_mapping("metro_data.csv")
