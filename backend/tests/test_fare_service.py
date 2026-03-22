import pytest
import networkx as nx
from fare_service import FareService

def test_calculate_fare_short_distance():
    G = nx.Graph()
    G.add_edge("A", "B", distance=1.5, type="travel")
    fare = FareService.calculate_fare(["A", "B"], G)
    assert fare == 11

def test_calculate_fare_medium_distance():
    G = nx.Graph()
    G.add_edge("A", "B", distance=3.0, type="travel")
    G.add_edge("B", "C", distance=2.0, type="travel")
    assert FareService.calculate_fare(["A", "B", "C"], G) == 21

def test_calculate_fare_with_interchange():
    G = nx.Graph()
    G.add_edge("A", "B", distance=6.0, type="travel")
    G.add_edge("B", "C", distance=0.0, type="interchange")
    G.add_edge("C", "D", distance=5.0, type="travel")
    assert FareService.calculate_fare(["A", "B", "C", "D"], G) == 32

def test_calculate_fare_higher_brackets():
    G = nx.Graph()
    G.add_edge("A", "B", distance=15.0, type="travel")
    assert FareService.calculate_fare(["A", "B"], G) == 43

    G.add_edge("B", "C", distance=10.0, type="travel")
    assert FareService.calculate_fare(["A", "B", "C"], G) == 54

    G.add_edge("C", "D", distance=10.0, type="travel")
    assert FareService.calculate_fare(["A", "B", "C", "D"], G) == 64
