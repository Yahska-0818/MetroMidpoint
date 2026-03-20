import networkx as nx
from typing import List
class FareService:
    @staticmethod
    def calculate_fare(path: List[str], graph: nx.Graph) -> int:
        dist_km = sum(
            graph[path[i]][path[i + 1]].get("distance", 0)
            for i in range(len(path) - 1)
            if graph[path[i]][path[i + 1]]["type"] == "travel"
        )
        if dist_km <= 2:
            return 11
        elif dist_km <= 5:
            return 21
        elif dist_km <= 12:
            return 32
        elif dist_km <= 21:
            return 43
        elif dist_km <= 32:
            return 54
        else:
            return 64
