import os
import pandas as pd
import networkx as nx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
MEETUP_SPOTS = {
    "Rajiv Chowk": "Meet at Gate 7",
    "Kashmere Gate": "Meet near Gate 1",
    "Hauz Khas": "Meet at the concourse near Gate 3",
    "Botanical Garden": "Meet near Gate 4",
    "Mandi House": "Meet near Gate 3",
    "Central Secretariat": "Meet near Gate 2",
    "New Delhi": "Meet near Gate 1",
    "Yamuna Bank": "Meet at the main concourse interchange area",
    "Welcome": "Meet near Gate 2",
    "Lajpat Nagar": "Meet near Gate 1",
    "INA": "Meet near Gate 2",
}


class MeetRequest(BaseModel):
    stations: list[str]


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


def calculate_fare(path, graph):
    time_no_interchange = 0
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        w = graph[u][v]["weight"]
        if w != 5.0:
            time_no_interchange += w
    dist_km = time_no_interchange / 1.7
    if dist_km <= 2:
        return 10
    elif dist_km <= 5:
        return 20
    elif dist_km <= 12:
        return 30
    elif dist_km <= 21:
        return 40
    elif dist_km <= 32:
        return 50
    else:
        return 60


@app.post("/find-midpoint")
def find_midpoint(req: MeetRequest):
    if len(req.stations) < 2:
        raise HTTPException(status_code=400, detail="At least two stations required")
    dists = []
    paths = []
    for st in req.stations:
        d = nx.single_source_dijkstra_path_length(metro_graph, st)
        p = nx.single_source_dijkstra_path(metro_graph, st)
        dists.append(d)
        paths.append(p)
    best_station = ""
    min_max_time = float("inf")
    for node in metro_graph.nodes:
        if all(node in d for d in dists):
            max_time = max(d[node] for d in dists)
            if max_time < min_max_time:
                min_max_time = float(max_time)
                best_station = str(node)
    if not best_station:
        raise HTTPException(status_code=404, detail="Path not found")
    best_station_name = best_station.split(" (")[0]
    routes = [
        {
            "fare": calculate_fare(p[best_station], metro_graph),
            "steps": format_route(p[best_station]),
        }
        for p in paths
    ]
    meetup_spot = MEETUP_SPOTS.get(
        best_station_name, "Meet near the customer care center at the concourse level."
    )
    return {
        "meet_station": best_station_name,
        "time_taken": round(min_max_time),
        "meetup_spot": meetup_spot,
        "routes": routes,
    }


if os.path.isdir("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path != "" and os.path.exists(f"dist/{full_path}"):
            return FileResponse(f"dist/{full_path}")
        return FileResponse("dist/index.html")
