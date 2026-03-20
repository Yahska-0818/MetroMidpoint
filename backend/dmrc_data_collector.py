import requests
import random
import time
import json
import pandas as pd
import logging
import re
import difflib
import networkx as nx
from datetime import datetime
from typing import List
from graph_loader import GraphLoader
BASE_URL = "https://backend.delhimetrorail.com/api/v2/en/station_route"
HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://www.delhimetrorail.com/",
}
STATION_CODES_FILE = "station_codes.json"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)
def get_timestamp() -> str:
    return datetime.now().isoformat()
def parse_time(t: str) -> float:
    h, m, s = map(int, t.split(":"))
    return h * 60 + m + s / 60
def normalize(name: str) -> str:
    name = re.sub(r"\(.*?\)", "", name)
    return re.sub(r"[^a-z0-9]", "", name.lower())
def load_station_codes():
    with open(STATION_CODES_FILE, "r") as f:
        return json.load(f)
def build_node_map(graph):
    return {normalize(n.split(" (")[0]): n for n in graph.nodes}
def get_closest_node(raw_name: str, node_map: dict):
    norm_name = normalize(raw_name)
    if norm_name in node_map:
        return node_map[norm_name]
    matches = difflib.get_close_matches(norm_name, node_map.keys(), n=1, cutoff=0.6)
    if matches:
        return node_map[matches[0]]
    return None
def fetch_route(src_code: str, dst_code: str):
    url = f"{BASE_URL}/{src_code}/{dst_code}/least-distance/{get_timestamp()}"
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        if res.status_code == 200:
            return res.json()
        logger.warning(f"API non-200: {src_code} -> {dst_code} | {res.status_code}")
    except Exception as e:
        logger.error(f"API error: {src_code} -> {dst_code} | {e}")
    return None
def extract_features(response: dict):
    total_time = parse_time(response["total_time"])
    stations = response["stations"]
    interchanges = max(0, len(response["route"]) - 1)
    return total_time, stations, interchanges
def flatten_path(response: dict) -> List[str]:
    path = []
    for segment in response["route"]:
        for s in segment["path"]:
            path.append(s["name"])
    return path
def compute_distance_from_graph(path: List[str], graph, node_map) -> float:
    dist = 0.0
    for i in range(len(path) - 1):
        raw_u = path[i]
        raw_v = path[i + 1]
        if raw_u == raw_v:
            continue
        u = get_closest_node(raw_u, node_map)
        v = get_closest_node(raw_v, node_map)
        if not u or not v:
            logger.debug(f"Mapping failed: '{raw_u}'={u}, '{raw_v}'={v}")
            continue
        if graph.has_edge(u, v):
            edge = graph[u][v]
            if isinstance(edge, dict) and 0 in edge:
                edge = edge[0]
            if edge.get("type", "travel") == "travel":
                dist += float(edge.get("distance", 0.0))
        else:
            try:
                sub_dist = nx.shortest_path_length(graph, u, v, weight="distance")
                dist += float(sub_dist)
            except nx.NetworkXNoPath:
                logger.debug(f"Graph missing path between: '{u}' and '{v}'")
    return dist
def generate_station_pairs(stations: List[str], samples: int):
    pairs = set()
    while len(pairs) < samples:
        a, b = random.sample(stations, 2)
        if a != b:
            pairs.add((a, b))
    return list(pairs)
def build_dataset(graph, samples=200):
    station_codes = load_station_codes()
    station_names = list(station_codes.keys())
    pairs = generate_station_pairs(station_names, samples)
    node_map = build_node_map(graph)
    data = []
    seen = set()
    logger.info(f"Starting dataset build with {len(pairs)} pairs")
    for idx, (src, dst) in enumerate(pairs, 1):
        if (src, dst) in seen:
            continue
        seen.add((src, dst))
        logger.info(f"[{idx}/{len(pairs)}] Fetching: {src} -> {dst}")
        response = fetch_route(station_codes[src], station_codes[dst])
        if not response:
            logger.warning(f"Skipped (no response): {src} -> {dst}")
            continue
        try:
            time_min, stations, interchanges = extract_features(response)
            path = flatten_path(response)
            distance = compute_distance_from_graph(path, graph, node_map)
            if distance == 0:
                logger.warning(f"Skipped (zero distance): {src} -> {dst}")
                logger.warning(f"Failed Path sequence: {path}")
                continue
            data.append({"source": src, "destination": dst, "distance": round(distance, 2), "stations": stations, "interchanges": interchanges, "time": round(time_min, 2)})
            logger.info(f"Added: {src} -> {dst} | {time_min:.2f} min | {distance:.2f} km")
        except Exception as e:
            logger.error(f"Processing error: {src} -> {dst} | {e}")
        time.sleep(0.4)
    logger.info(f"Dataset build complete. Total records: {len(data)}")
    return pd.DataFrame(data)
if __name__ == "__main__":
    logger.setLevel(logging.INFO)
    loader = GraphLoader("metro_data.csv")
    graph = loader.build_or_load_graph()
    df = build_dataset(graph, samples=250)
    df.to_csv("dmrc_training_data.csv", index=False)
    logger.info("Dataset saved to dmrc_training_data.csv")
