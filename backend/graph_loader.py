import os
import pickle
import hashlib
import pandas as pd
import networkx as nx
from gtfs_parser import GTFSParser

class GraphLoader:
    INTERCHANGE_PENALTIES = {
        "Rajiv Chowk": 4.5,
        "Kashmere Gate": 5.0,
        "Mandi House": 4.5,
        "Kalkaji Mandir": 4.5,
    }
    DEFAULT_INTERCHANGE = 4.0
    PICKLE_PATH = "graph.pkl"
    HASH_PATH = "graph_hash.txt"
    CIRCULAR_LINES = ["Pink line"]

    def __init__(self, csv_url: str, gtfs_path: str = "gtfs_data"):
        self.csv_url = csv_url
        self.gtfs_path = gtfs_path

    def _compute_csv_hash(self) -> str:
        df = pd.read_csv(self.csv_url)
        df = df.sort_values(by=list(df.columns)).reset_index(drop=True)
        csv_bytes = df.to_csv(index=False).encode("utf-8")
        return hashlib.md5(csv_bytes).hexdigest()

    def build_or_load_graph(self) -> nx.Graph:
        current_hash = self._compute_csv_hash()

        if os.path.exists(self.PICKLE_PATH) and os.path.exists(self.HASH_PATH):
            with open(self.HASH_PATH, "r") as f:
                saved_hash = f.read().strip()

            if saved_hash == current_hash:
                with open(self.PICKLE_PATH, "rb") as f:
                    return pickle.load(f)

        df = pd.read_csv(self.csv_url)
        df["Station Name"] = df["Station Name"].str.replace(r"\s*\[.*\]", "", regex=True).str.strip()
        df["Node Name"] = df["Station Name"] + " (" + df["Line"] + ")"

        G = nx.Graph()
        gtfs_weights = GTFSParser.compute_edge_weights_from_gtfs(self.gtfs_path)

        for name, group in df.groupby("Line"):
            group = group.sort_values("Distance from Start (km)")
            nodes = group.to_dict("records")

            for i in range(len(nodes) - 1):
                u, v = nodes[i], nodes[i + 1]
                
                dist = u.get("Distance To Next")
                physical_distance = float(dist) if pd.notna(dist) else abs(v["Distance from Start (km)"] - u["Distance from Start (km)"])

                segment_time = v.get("Segment Time (min)", 2.5)
                pair = tuple(sorted((u["Station Name"], v["Station Name"])))
                weight = gtfs_weights.get(pair, segment_time)

                G.add_edge(
                    u["Node Name"],
                    v["Node Name"],
                    weight=weight,
                    distance=physical_distance,
                    type="travel",
                )

            if name in self.CIRCULAR_LINES and len(nodes) > 1:
                first_node = nodes[0]
                last_node = nodes[-1]

                wrap_dist = last_node.get("Distance To Next")
                physical_distance = float(wrap_dist) if pd.notna(wrap_dist) else 2.0

                segment_time = 2.5
                pair = tuple(sorted((first_node["Station Name"], last_node["Station Name"])))
                weight = gtfs_weights.get(pair, segment_time)

                G.add_edge(
                    last_node["Node Name"],
                    first_node["Node Name"],
                    weight=weight,
                    distance=physical_distance,
                    type="travel",
                )

        for station, group in df.groupby("Station Name"):
            nodes = group["Node Name"].tolist()
            penalty = self.INTERCHANGE_PENALTIES.get(station, self.DEFAULT_INTERCHANGE)

            for i in range(len(nodes)):
                for j in range(i + 1, len(nodes)):
                    G.add_edge(
                        nodes[i],
                        nodes[j],
                        weight=penalty,
                        distance=0.0,
                        type="interchange",
                    )

        with open(self.PICKLE_PATH, "wb") as f:
            pickle.dump(G, f)

        with open(self.HASH_PATH, "w") as f:
            f.write(current_hash)

        return G
