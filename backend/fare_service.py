import networkx as nx
from typing import List


class FareService:
    @staticmethod
    def calculate_fare(path: List[str], graph: nx.Graph) -> int:
        """Calculates fare based on physical distance, excluding interchange penalties."""
        travel_time = 0.0
        for i in range(len(path) - 1):
            edge_data = graph[path[i]][path[i + 1]]
            if edge_data["type"] == "travel":
                travel_time += edge_data["weight"]

        dist_km = travel_time / 1.7
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
