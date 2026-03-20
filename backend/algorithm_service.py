import networkx as nx
import pandas as pd
import pickle
from typing import Dict, Any, List
from fare_service import FareService


class AlgorithmService:
    def __init__(self, graph: nx.Graph, csv_url: str):
        self.graph = graph
        self.df = pd.read_csv(csv_url)
        self.df["Station Name"] = (
            self.df["Station Name"]
            .str.replace(r"\s*\[.*\]", "", regex=True)
            .str.strip()
        )
        self.df["Node Name"] = self.df["Station Name"] + " (" + self.df["Line"] + ")"
        self.centrality = nx.degree_centrality(graph)
        with open("model.pkl", "rb") as f:
            self.model = pickle.load(f)
        self.all_pairs_shortest = {}
        self._precompute_all_paths()

    def _precompute_all_paths(self):
        for node in self.graph.nodes:
            dists, paths = nx.single_source_dijkstra(self.graph, node)
            self.all_pairs_shortest[node] = {"distances": dists, "paths": paths}

    def _resolve_station_name(self, station_name: str) -> str:
        if station_name in self.graph.nodes:
            return station_name
        lower_map = {n.lower(): n for n in self.graph.nodes}
        if station_name.lower() in lower_map:
            return lower_map[station_name.lower()]
        possible = self.df[self.df["Station Name"].str.lower() == station_name.lower()][
            "Node Name"
        ].tolist()
        return possible[0]

    def get_route_details(self, source: str, destination: str) -> Dict[str, Any]:
        path = self.all_pairs_shortest[source]["paths"][destination]
        stations = len(path)
        interchanges = sum(
            1
            for i in range(len(path) - 1)
            if self.graph[path[i]][path[i + 1]]["type"] == "interchange"
        )
        distance = sum(
            self.graph[path[i]][path[i + 1]].get("distance", 0)
            for i in range(len(path) - 1)
            if self.graph[path[i]][path[i + 1]]["type"] == "travel"
        )
        features = pd.DataFrame(
            [[distance, stations, interchanges]],
            columns=["distance", "stations", "interchanges"],
        )
        time = self.model.predict(features)[0]
        formatted_path = []
        for node in path:
            name, line = node.rsplit(" (", 1)
            formatted_path.append({"name": name, "line": line.strip(")")})
        return {
            "path": formatted_path,
            "total_time": round(time, 1),
            "fare": FareService.calculate_fare(path, self.graph),
            "interchanges": interchanges,
        }

    def find_best_midpoint(self, start_stations: List[str]) -> Dict[str, Any]:
        resolved_start_nodes = [self._resolve_station_name(s) for s in start_stations]
        candidates = []
        for node in self.graph.nodes:
            if all(
                node in self.all_pairs_shortest[s]["distances"]
                for s in resolved_start_nodes
            ):
                times = []
                total_interchanges = 0
                for s in resolved_start_nodes:
                    p = self.all_pairs_shortest[s]["paths"][node]
                    stations = len(p)
                    interchanges = sum(
                        1
                        for i in range(len(p) - 1)
                        if self.graph[p[i]][p[i + 1]]["type"] == "interchange"
                    )
                    total_interchanges += interchanges
                    distance = sum(
                        self.graph[p[i]][p[i + 1]].get("distance", 0)
                        for i in range(len(p) - 1)
                        if self.graph[p[i]][p[i + 1]]["type"] == "travel"
                    )
                    features = pd.DataFrame(
                        [[distance, stations, interchanges]],
                        columns=["distance", "stations", "interchanges"],
                    )
                    times.append(self.model.predict(features)[0])
                candidates.append(
                    {
                        "node": node,
                        "max_time": max(times),
                        "total_time": sum(times),
                        "centrality": self.centrality[node],
                        "total_interchanges": total_interchanges,
                    }
                )
        if not candidates:
            raise ValueError("No path exists between all participants")
        best = sorted(
            candidates,
            key=lambda x: (
                x["max_time"],
                x["total_time"],
                -x["centrality"],
                x["total_interchanges"],
            ),
        )[0]
        routes = [self.get_route_details(s, best["node"]) for s in resolved_start_nodes]
        return {
            "meet_station": best["node"].split(" (")[0],
            "max_travel_time": round(best["max_time"], 1),
            "routes": routes,
        }
