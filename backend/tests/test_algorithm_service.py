import pytest
from algorithm_service import AlgorithmService
from main import graph

def test_algo_service_init_no_feature_names(monkeypatch):
    import builtins
    original_open = builtins.open
    def mocked_open(name, mode='r', *args, **kwargs):
        if "feature_names.pkl" in name:
            raise FileNotFoundError("Mocked missing file")
        return original_open(name, mode, *args, **kwargs)
    
    with monkeypatch.context() as m:
        m.setattr(builtins, "open", mocked_open)
        service = AlgorithmService(graph, "metro_data.csv")
        assert "stations" in service.feature_names

def test_resolve_station_exact_node(real_algo_service):
    node_name = list(real_algo_service.graph.nodes)[0]
    res = real_algo_service._resolve_station_name(node_name)
    assert res == node_name

def test_resolve_station_exact_node_lower(real_algo_service):
    node_name = list(real_algo_service.graph.nodes)[0]
    res = real_algo_service._resolve_station_name(node_name.lower())
    assert res == node_name

def test_resolve_station_name(real_algo_service):
    resolved = real_algo_service._resolve_station_name("Rajiv Chowk")
    assert "Rajiv Chowk" in resolved

def test_resolve_station_name_lower(real_algo_service):
    resolved = real_algo_service._resolve_station_name("kashmere gate")
    assert "Kashmere Gate" in resolved

def test_get_route_details(real_algo_service):
    nodes = list(real_algo_service.graph.nodes)
    src = next(n for n in nodes if "Rajiv Chowk" in n)
    dest = next(n for n in nodes if "Kashmere Gate" in n)
    
    details = real_algo_service.get_route_details(src, dest)
    assert "path" in details
    assert "total_time" in details
    assert "fare" in details
    assert "interchanges" in details

def test_get_route_details_least_interchanges(real_algo_service):
    nodes = list(real_algo_service.graph.nodes)
    src = next(n for n in nodes if "Rajiv Chowk" in n)
    dest = next(n for n in nodes if "Kashmere Gate" in n)
    
    details = real_algo_service.get_route_details_least_interchanges(src, dest)
    assert "path" in details
    assert isinstance(details["interchanges"], int)

def test_find_best_midpoint(real_algo_service):
    res = real_algo_service.find_best_midpoint(["Rajiv Chowk", "Kalkaji Mandir"])
    assert "meet_station" in res
    assert "max_travel_time" in res
    assert "routes" in res
    assert len(res["routes"]) == 2

def test_find_best_midpoint_invalid(real_algo_service):
    with pytest.raises(Exception):
        real_algo_service.find_best_midpoint(["UnknownStationX", "UnknownStationY"])

def test_find_best_midpoint_no_path(real_algo_service, monkeypatch):
    resolved_rajiv = real_algo_service._resolve_station_name("Rajiv Chowk")
    resolved_kashmere = real_algo_service._resolve_station_name("Kashmere Gate")
    monkeypatch.setattr(
        real_algo_service, 
        "all_pairs_shortest", 
        {resolved_rajiv: {"distances": {}}, resolved_kashmere: {"distances": {}}}
    )
    with pytest.raises(ValueError, match="No path exists"):
        real_algo_service.find_best_midpoint(["Rajiv Chowk", "Kashmere Gate"])
