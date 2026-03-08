import networkx as nx
import pandas as pd
from typing import List, Dict, Any
from fare_service import FareService
import os


class AlgorithmService:
    def __init__(self, graph: nx.Graph, csv_url: str):
        self.graph = graph
        import os
local_csv = os.path.join(os.path.dirname(__file__), "metro_data.csv")
self.df = pd.read_csv(local_csv)
        self.df["Station Name"] = (
            self.df["Station Name"]
            .str.replace(r"\s*\[.*\]", "", regex=True)
            .str.strip()
        )
        self.df["Node Name"] = self.df["Station Name"] + " (" + self.df["Line"] + ")"

        self.centrality = nx.degree_centrality(graph)
        self.all_pairs_shortest: Dict[str, Dict[str, Any]] = {}
        self._precompute_all_paths()

    def _precompute_all_paths(self) -> None:
        for node in self.graph.nodes:
            dists, paths = nx.single_source_dijkstra(self.graph, node)
            self.all_pairs_shortest[node] = {"distances": dists, "paths": paths}

    def _resolve_station_name(self, station_name: str) -> str:
        if station_name in self.graph.nodes:
            return station_name

        lower_mapping = {n.lower(): n for n in self.graph.nodes}
        if station_name.lower() in lower_mapping:
            return lower_mapping[station_name.lower()]

        station_name_lower = station_name.lower()
        possible_nodes = self.df[
            self.df["Station Name"].str.lower() == station_name_lower
        ]["Node Name"].tolist()

        if not possible_nodes:
            raise ValueError(f"Station not found: {station_name}")

        best_node = sorted(
            possible_nodes, key=lambda x: self.centrality[x], reverse=True
        )[0]
        return best_node

    def get_route_details(self, source: str, destination: str) -> Dict[str, Any]:
        path = self.all_pairs_shortest[source]["paths"][destination]
        time = self.all_pairs_shortest[source]["distances"][destination]

        formatted_path = []
        interchanges = 0
        for i, node in enumerate(path):
            name, line = node.rsplit(" (", 1)
            formatted_path.append({"name": name, "line": line.strip(")")})
            if i > 0:
                if self.graph[path[i - 1]][path[i]]["type"] == "interchange":
                    interchanges += 1

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
                times = [
                    self.all_pairs_shortest[s]["distances"][node]
                    for s in resolved_start_nodes
                ]
                max_t = max(times)
                total_t = sum(times)

                interchanges = 0
                for s in resolved_start_nodes:
                    p = self.all_pairs_shortest[s]["paths"][node]
                    for i in range(len(p) - 1):
                        if self.graph[p[i]][p[i + 1]]["type"] == "interchange":
                            interchanges += 1

                candidates.append(
                    {
                        "node": node,
                        "max_time": max_t,
                        "total_time": total_t,
                        "centrality": self.centrality[node],
                        "total_interchanges": interchanges,
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
