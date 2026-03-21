import pytest
from main import algo_service
import pandas as pd

def test_list_stations(client):
    response = client.get("/stations")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0

def test_nearest_station(client):
    response = client.get("/nearest-station?lat=28.632&lng=77.219")
    assert response.status_code == 200
    assert "station" in response.json()

def test_nearest_station_missing_params(client):
    response = client.get("/nearest-station?lat=28.6139")
    assert response.status_code == 422 

def test_nearest_station_no_coordinates(client, monkeypatch):
    empty_df = pd.DataFrame(columns=['Latitude', 'Longitude', 'Node Name'])
    monkeypatch.setattr(algo_service, "df", empty_df)
    
    response = client.get("/nearest-station?lat=28.6&lng=77.2")
    assert response.status_code == 404
    assert response.json()["detail"] == "No station coordinates available"

def test_find_midpoint(client):
    payload = {"stations": ["Rajiv Chowk", "Kashmere Gate"]}
    response = client.post("/find-midpoint", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "meet_station" in data
    assert "routes" in data

def test_find_midpoint_invalid(client):
    payload = {"stations": ["InvalidStationX", "InvalidStationY"]}
    response = client.post("/find-midpoint", json=payload)
    assert response.status_code == 400

def test_find_midpoint_500(client, monkeypatch):
    def mock_find(*args, **kwargs):
        raise RuntimeError("Something went wrong")
    monkeypatch.setattr(algo_service, "find_best_midpoint", mock_find)
    
    payload = {"stations": ["Rajiv Chowk", "Kashmere Gate"]}
    response = client.post("/find-midpoint", json=payload)
    assert response.status_code == 500

def test_get_route_fastest(client):
    payload = {"source": "Rajiv Chowk", "destination": "Kashmere Gate"}
    response = client.post("/route?optimize=fastest", json=payload)
    assert response.status_code == 200
    assert "path" in response.json()

def test_get_route_fewest_interchanges(client):
    payload = {"source": "Rajiv Chowk", "destination": "Kashmere Gate"}
    response = client.post("/route?optimize=fewest_interchanges", json=payload)
    assert response.status_code == 200
    assert "path" in response.json()

def test_get_route_invalid(client):
    payload = {"source": "InvalidStationXZYX", "destination": "Kashmere Gate"}
    response = client.post("/route", json=payload)
    assert response.status_code == 400

def test_get_route_500(client, monkeypatch):
    def mock_get(*args, **kwargs):
        raise RuntimeError("Something went wrong")
    monkeypatch.setattr(algo_service, "get_route_details", mock_get)
    
    payload = {"source": "Rajiv Chowk", "destination": "Kashmere Gate"}
    response = client.post("/route?optimize=fastest", json=payload)
    assert response.status_code == 500

def test_frontend_fallback_routes(client):
    res = client.get("/test.txt")
    assert res.status_code == 200
    assert res.text.strip() == "test"
    
    res2 = client.get("/nonexistent.txt")
    assert res2.status_code == 200
    assert res2.text.strip() == "index"
    
    res3 = client.get("/")
    assert res3.status_code == 200
    assert res3.text.strip() == "index"
