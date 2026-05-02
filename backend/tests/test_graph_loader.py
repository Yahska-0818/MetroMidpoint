import os
import tempfile

import networkx as nx

from graph_loader import GraphLoader


def test_build_or_load_graph_from_scratch():
    with tempfile.NamedTemporaryFile(
        delete=False
    ) as tmp_pkl, tempfile.NamedTemporaryFile(delete=False) as tmp_hash:
        tmp_pkl_name = tmp_pkl.name
        tmp_hash_name = tmp_hash.name

    try:
        loader = GraphLoader("metro_data.csv")
        loader.PICKLE_PATH = tmp_pkl_name
        loader.HASH_PATH = tmp_hash_name

        graph = loader.build_or_load_graph()
        assert isinstance(graph, nx.Graph)
        assert len(graph.nodes) > 0

        assert os.path.getsize(tmp_pkl_name) > 0
        assert os.path.getsize(tmp_hash_name) > 0

        graph_cached = loader.build_or_load_graph()
        assert len(graph_cached.nodes) == len(graph.nodes)

    finally:
        if os.path.exists(tmp_pkl_name):
            os.remove(tmp_pkl_name)
        if os.path.exists(tmp_hash_name):
            os.remove(tmp_hash_name)
