import pandas as pd
import pytest

from main import algo_service


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
    empty_df = pd.DataFrame(columns=["Latitude", "Longitude", "Node Name"])
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


def test_get_route(client):
    payload = {"source": "Rajiv Chowk", "destination": "Kashmere Gate"}
    response = client.post("/route", json=payload)
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
    response = client.post("/route", json=payload)
    assert response.status_code == 500


def test_frontend_fallback_routes(client):
    res = client.get("/test.txt")
    assert res.status_code == 200
    assert res.text == "test"


if __name__ == "__main__":
    pytest.main([__file__])
