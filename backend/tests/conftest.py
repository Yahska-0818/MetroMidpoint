import os
import sys
import pytest
import networkx as nx
import pandas as pd
from fastapi.testclient import TestClient
from main import app, graph, algo_service

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

@pytest.fixture(scope="session")
def client():
    return TestClient(app)

@pytest.fixture(scope="session")
def real_graph():
    return graph

@pytest.fixture(scope="session")
def real_algo_service():
    return algo_service
