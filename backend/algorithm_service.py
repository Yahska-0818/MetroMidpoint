from typing import Any, Dict, List

import networkx as nx
import pandas as pd

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
        self.all_pairs_shortest = {}
        self.all_pairs_fewest_interchanges = {}
        self._load_edge_times()
        self._setup_interchange_weights()
        self._precompute_all_paths()

    def _load_edge_times(self):
        try:
            times_df = pd.read_csv("edge_times.csv")
            for _, row in times_df.iterrows():
                if self.graph.has_edge(row["u"], row["v"]):
                    self.graph[row["u"]][row["v"]]["time"] = float(row["time"])
        except FileNotFoundError:
            pass

    def _setup_interchange_weights(self):
        for u, v, data in self.graph.edges(data=True):
            if data.get("type") == "interchange":
                self.graph[u][v]["interchange_cost"] = 1.0
            else:
                self.graph[u][v]["interchange_cost"] = 0.0001

    def _precompute_all_paths(self):
        for node in self.graph.nodes:
            dists, paths = nx.single_source_dijkstra(self.graph, node, weight="time")
            self.all_pairs_shortest[node] = {"distances": dists, "paths": paths}
            d_int, p_int = nx.single_source_dijkstra(
                self.graph, node, weight="interchange_cost"
            )
            self.all_pairs_fewest_interchanges[node] = {
                "distances": d_int,
                "paths": p_int,
            }

    def _resolve_station_name(self, station_name: str) -> str:
        if station_name in self.graph.nodes:
            return station_name
        lower_map = {n.lower(): n for n in self.graph.nodes}
        if station_name.lower() in lower_map:
            return lower_map[station_name.lower()]
        possible = self.df[self.df["Station Name"].str.lower() == station_name.lower()][
            "Node Name"
        ].tolist()
        if not possible:
            raise ValueError(f"Invalid station: {station_name}")
        return possible[0]

    def get_route_details(self, source: str, destination: str) -> Dict[str, Any]:
        return self._build_route_response(source, destination, self.all_pairs_shortest)

    def get_route_details_least_interchanges(
        self, source: str, destination: str
    ) -> Dict[str, Any]:
        return self._build_route_response(
            source, destination, self.all_pairs_fewest_interchanges
        )

    def _build_route_response(
        self, source: str, destination: str, target_dict: dict
    ) -> Dict[str, Any]:
        src_node = self._resolve_station_name(source)
        dst_node = self._resolve_station_name(destination)
        if dst_node not in target_dict.get(src_node, {}).get("paths", {}):
            raise ValueError("Route not found")
        path = target_dict[src_node]["paths"][dst_node]
        time = sum(
            self.graph[path[i]][path[i + 1]].get("time", 3.0)
            for i in range(len(path) - 1)
        )
        interchanges = sum(
            1
            for i in range(len(path) - 1)
            if self.graph[path[i]][path[i + 1]]["type"] == "interchange"
        )
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
        valid_nodes = []
        for node in self.graph.nodes:
            if all(
                node in self.all_pairs_shortest[s]["distances"]
                for s in resolved_start_nodes
            ):
                valid_nodes.append(node)
        if not valid_nodes:
            raise ValueError("No path exists between all participants")
        candidates = []
        for node in valid_nodes:
            node_times = [
                self.all_pairs_shortest[s]["distances"][node]
                for s in resolved_start_nodes
            ]
            total_interchanges = 0
            for s in resolved_start_nodes:
                p = self.all_pairs_shortest[s]["paths"][node]
                total_interchanges += sum(
                    1
                    for i in range(len(p) - 1)
                    if self.graph[p[i]][p[i + 1]]["type"] == "interchange"
                )
            candidates.append(
                {
                    "node": node,
                    "max_time": max(node_times),
                    "total_time": sum(node_times),
                    "centrality": self.centrality[node],
                    "total_interchanges": total_interchanges,
                }
            )
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
