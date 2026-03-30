import os
import sys
import pytest
import networkx as nx
import pandas as pd
from fastapi.testclient import TestClient
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
dist_dir = os.path.join(os.path.dirname(__file__), "..", "dist")
os.makedirs(os.path.join(dist_dir, "assets"), exist_ok=True)
with open(os.path.join(dist_dir, "index.html"), "w") as f:
    f.write("index")
with open(os.path.join(dist_dir, "test.txt"), "w") as f:
    f.write("test")
from main import app, graph, algo_service
@pytest.fixture(scope="session")
def client():
    return TestClient(app)
@pytest.fixture(scope="session")
def real_graph():
    return graph
@pytest.fixture(scope="session")
def real_algo_service():
    return algo_service
