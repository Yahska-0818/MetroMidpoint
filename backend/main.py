import os
import pandas as pd
import networkx as nx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
metro_graph = nx.Graph()
CSV_FILE = "metro_data.csv"
URL = "https://raw.githubusercontent.com/sachinbajaj4477/Delhi-Metro-Network-Analysis/main/Delhi-Metro-Network.csv"
if not os.path.exists(CSV_FILE):
    df = pd.read_csv(URL)
    df.to_csv(CSV_FILE, index=False)
else:
    df = pd.read_csv(CSV_FILE)
df["Station Name"] = (
    df["Station Name"].str.replace(r"\s*\[.*\]", "", regex=True).str.strip()
)
df["Node Name"] = df["Station Name"] + " (" + df["Line"] + ")"
for line, group in df.groupby("Line"):
    group = group.sort_values("Distance from Start (km)")
    stations = group["Node Name"].tolist()
    distances = group["Distance from Start (km)"].tolist()
    for i in range(len(stations) - 1):
        weight = abs(distances[i + 1] - distances[i]) * 1.7
        metro_graph.add_edge(stations[i], stations[i + 1], weight=weight)
for station, group in df.groupby("Station Name"):
    nodes = group["Node Name"].tolist()
    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            metro_graph.add_edge(nodes[i], nodes[j], weight=5.0)


class MeetRequest(BaseModel):
    station_a: str
    station_b: str


@app.get("/stations")
def get_stations():
    return sorted(list(metro_graph.nodes))


def format_route(path):
    route = []
    for s in path:
        parts = str(s).split(" (")
        name = parts[0]
        line = parts[1].replace(")", "") if len(parts) > 1 else "Unknown"
        if not route or route[-1]["name"] != name or route[-1]["line"] != line:
            route.append({"name": name, "line": line})
    return route


@app.post("/find-midpoint")
def find_midpoint(req: MeetRequest):
    dist_a = nx.single_source_dijkstra_path_length(metro_graph, req.station_a)
    path_a = nx.single_source_dijkstra_path(metro_graph, req.station_a)
    dist_b = nx.single_source_dijkstra_path_length(metro_graph, req.station_b)
    path_b = nx.single_source_dijkstra_path(metro_graph, req.station_b)
    best_station = ""
    min_max_time = float("inf")
    for node in metro_graph.nodes:
        if node in dist_a and node in dist_b:
            max_time = max(dist_a[node], dist_b[node])
            if max_time < min_max_time:
                min_max_time = float(max_time)
                best_station = str(node)
    if not best_station:
        raise HTTPException(status_code=404, detail="Path not found")
    route_a = format_route(path_a[best_station])
    route_b = format_route(path_b[best_station])
    return {
        "meet_station": best_station.split(" (")[0],
        "time_taken": round(min_max_time),
        "route_a": route_a,
        "route_b": route_b,
    }
