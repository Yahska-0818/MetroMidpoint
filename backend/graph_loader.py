import os
import pickle
import pandas as pd
import networkx as nx
from typing import Dict, Tuple
from gtfs_parser import GTFSParser


class GraphLoader:
    INTERCHANGE_PENALTIES = {
        "Rajiv Chowk": 7.0,
        "Kashmere Gate": 8.0,
        "Mandi House": 6.0,
    }
    DEFAULT_INTERCHANGE = 5.0
    PICKLE_PATH = "graph.pkl"

    def __init__(self, csv_url: str, gtfs_path: str = "gtfs_data"):
        self.csv_url = csv_url
        self.gtfs_path = gtfs_path

    def build_or_load_graph(self) -> nx.Graph:
        if os.path.exists(self.PICKLE_PATH):
            with open(self.PICKLE_PATH, "rb") as f:
                return pickle.load(f)

        df = pd.read_csv(self.csv_url)
        df["Station Name"] = (
            df["Station Name"].str.replace(r"\s*\[.*\]", "", regex=True).str.strip()
        )
        df["Node Name"] = df["Station Name"] + " (" + df["Line"] + ")"

        G = nx.Graph()
        gtfs_weights = GTFSParser.compute_edge_weights_from_gtfs(self.gtfs_path)

        for line, group in df.groupby("Line"):
            group = group.sort_values("Distance from Start (km)")
            nodes = group.to_dict("records")
            for i in range(len(nodes) - 1):
                u, v = nodes[i], nodes[i + 1]
                dist_weight = (
                    abs(v["Distance from Start (km)"] - u["Distance from Start (km)"])
                    * 1.7
                )
                pair = tuple(sorted((u["Station Name"], v["Station Name"])))
                weight = gtfs_weights.get(pair, dist_weight)

                G.add_edge(
                    nodes[i]["Node Name"],
                    nodes[i + 1]["Node Name"],
                    weight=weight,
                    type="travel",
                )

        for station, group in df.groupby("Station Name"):
            nodes = group["Node Name"].tolist()
            penalty = self.INTERCHANGE_PENALTIES.get(station, self.DEFAULT_INTERCHANGE)
            for i in range(len(nodes)):
                for j in range(i + 1, len(nodes)):
                    G.add_edge(nodes[i], nodes[j], weight=penalty, type="interchange")

        with open(self.PICKLE_PATH, "wb") as f:
            pickle.dump(G, f)
        return G
