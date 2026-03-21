import networkx as nx
import pandas as pd
import pickle
import numpy as np
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

        try:
            with open("feature_names.pkl", "rb") as f:
                self.feature_names = pickle.load(f)
        except FileNotFoundError:
            self.feature_names = [
                "stations", "distance", "interchanges", "log_distance", "log_stations",
                "avg_station_dist", "interchange_ratio", "interchange_density",
                "distance_sq", "stations_sq", "dist_x_interchanges",
                "stations_x_interchanges", "is_short_route", "is_long_route",
                "is_very_long_route", "graph_weight", "effective_stations",
            ]

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

    def _build_features(self, distance: float, stations: int, interchanges: int) -> list:
        log_distance = np.log1p(distance)
        log_stations = np.log1p(stations)
        avg_station_dist = distance / stations if stations > 0 else 0
        interchange_ratio = interchanges / stations if stations > 0 else 0
        interchange_density = interchanges / max(distance, 0.1)
        distance_sq = distance ** 2
        stations_sq = stations ** 2
        dist_x_interchanges = distance * interchanges
        stations_x_interchanges = stations * interchanges
        is_short_route = int(distance <= 5)
        is_long_route = int(distance > 12)
        is_very_long_route = int(distance > 30)
        graph_weight = (distance * 1.7) + (interchanges * 5.0)
        effective_stations = stations + (interchanges * 1.5)
        return [
            stations, distance, interchanges, log_distance, log_stations,
            avg_station_dist, interchange_ratio, interchange_density,
            distance_sq, stations_sq, dist_x_interchanges, stations_x_interchanges,
            is_short_route, is_long_route, is_very_long_route, graph_weight, effective_stations,
        ]

    def _predict_time(self, distance: float, stations: int, interchanges: int) -> float:
        row = self._build_features(distance, stations, interchanges)
        features_df = pd.DataFrame([row], columns=self.feature_names)
        return self.model.predict(features_df)[0]

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

        time = self._predict_time(distance, stations, interchanges)

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

    def get_route_details_least_interchanges(self, source: str, destination: str) -> Dict[str, Any]:
        def interchange_biased_weight(u, v, data):
            if data.get("type") == "interchange":
                return 10_000 + data["weight"]
            return data["weight"]

        path = nx.dijkstra_path(
            self.graph, source, destination, weight=interchange_biased_weight
        )

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

        time = self._predict_time(distance, stations, interchanges)

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
        feature_batch = []

        for node in self.graph.nodes:
            if all(
                node in self.all_pairs_shortest[s]["distances"]
                for s in resolved_start_nodes
            ):
                valid_nodes.append(node)
                for s in resolved_start_nodes:
                    p = self.all_pairs_shortest[s]["paths"][node]
                    p_stations = len(p)
                    p_interchanges = sum(
                        1
                        for i in range(len(p) - 1)
                        if self.graph[p[i]][p[i + 1]]["type"] == "interchange"
                    )
                    p_distance = sum(
                        self.graph[p[i]][p[i + 1]].get("distance", 0)
                        for i in range(len(p) - 1)
                        if self.graph[p[i]][p[i + 1]]["type"] == "travel"
                    )
                    feature_batch.append(self._build_features(p_distance, p_stations, p_interchanges))

        if not valid_nodes:
            raise ValueError("No path exists between all participants")

        batch_df = pd.DataFrame(feature_batch, columns=self.feature_names)
        predictions = self.model.predict(batch_df)

        candidates = []
        num_starts = len(resolved_start_nodes)
        for idx, node in enumerate(valid_nodes):
            node_times = predictions[idx * num_starts : (idx + 1) * num_starts]
            node_features = feature_batch[idx * num_starts : (idx + 1) * num_starts]
            total_interchanges = sum(f[2] for f in node_features)

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
