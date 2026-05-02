import json
import logging
import time
from datetime import datetime

import pandas as pd
import requests

from graph_loader import GraphLoader

BASE_URL = "https://backend.delhimetrorail.com/api/v2/en/station_route"
HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://www.delhimetrorail.com/"}
logging.basicConfig(level=logging.INFO, format="%(message)s")


def fetch_time(src_code: str, dst_code: str):
    url = (
        f"{BASE_URL}/{src_code}/{dst_code}/least-distance/{datetime.now().isoformat()}"
    )
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        if res.status_code == 200:
            t = res.json()["total_time"]
            h, m, s = map(int, t.split(":"))
            return h * 60 + m + s / 60
    except:
        pass
    return None


def build_time_graph():
    with open("station_codes.json", "r") as f:
        codes = json.load(f)
    loader = GraphLoader("metro_data.csv")
    graph = loader.build_or_load_graph()
    edge_times = []
    for u, v, data in graph.edges(data=True):
        if data.get("type") == "interchange":
            edge_times.append({"u": u, "v": v, "time": 4.0})
            continue
        u_base = u.split(" (")[0]
        v_base = v.split(" (")[0]
        c_u, c_v = codes.get(u_base), codes.get(v_base)
        if not c_u or not c_v:
            edge_times.append({"u": u, "v": v, "time": 3.0})
            continue
        t = fetch_time(c_u, c_v)
        if t:
            edge_times.append({"u": u, "v": v, "time": t})
            logging.info(f"Fetched: {u} -> {v}: {t} mins")
        else:
            edge_times.append({"u": u, "v": v, "time": 3.0})
        time.sleep(0.3)
    pd.DataFrame(edge_times).to_csv("edge_times.csv", index=False)


if __name__ == "__main__":
    build_time_graph()
