import pandas as pd
import os
from typing import Dict, Tuple, Optional


class GTFSParser:
    @staticmethod
    def compute_edge_weights_from_gtfs(gtfs_path: str) -> Dict[Tuple[str, str], float]:
        """
        Parses GTFS files to calculate average travel times between stations.
        Expects a directory containing stops.txt, stop_times.txt, etc.
        """
        if not os.path.exists(gtfs_path):
            return {}

        try:
            stop_times = pd.read_csv(os.path.join(gtfs_path, "stop_times.txt"))
            stops = pd.read_csv(os.path.join(gtfs_path, "stops.txt"))

            stop_map = dict(zip(stops["stop_id"], stops["stop_name"]))

            stop_times["arrival_dt"] = pd.to_datetime(
                stop_times["arrival_time"], errors="coerce"
            )
            stop_times = stop_times.dropna(subset=["arrival_dt"]).sort_values(
                ["trip_id", "stop_sequence"]
            )

            edges: Dict[Tuple[str, str], List[float]] = {}

            for _, group in stop_times.groupby("trip_id"):
                stops_list = group.to_dict("records")
                for i in range(len(stops_list) - 1):
                    u = stop_map.get(stops_list[i]["stop_id"])
                    v = stop_map.get(stops_list[i + 1]["stop_id"])
                    duration = (
                        stops_list[i + 1]["arrival_dt"] - stops_list[i]["arrival_dt"]
                    ).total_seconds() / 60.0

                    if u and v and duration > 0:
                        pair = tuple(sorted((u, v)))
                        if pair not in edges:
                            edges[pair] = []
                        edges[pair].append(duration)

            return {pair: sum(times) / len(times) for pair, times in edges.items()}
        except Exception:
            return {}
