import pandas as pd
import math
from main import algo_service

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * (math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def test_red_line_station_distances():
    df = algo_service.df
    red_line = df[df["Line"] == "Red line"].sort_values("Distance from Start (km)").reset_index(drop=True)
    assert len(red_line) > 10

    for i in range(len(red_line) - 1):
        u = red_line.iloc[i]
        v = red_line.iloc[i + 1]
        
        lat1, lon1 = u["Latitude"], u["Longitude"]
        lat2, lon2 = v["Latitude"], v["Longitude"]
        
        dist = haversine(lat1, lon1, lat2, lon2)
        expected = abs(v["Distance from Start (km)"] - u["Distance from Start (km)"])
        
        assert abs(dist - expected) < 1.0, f"Distance discrepancy between {u['Station Name']} and {v['Station Name']}: coordinate distance={dist} km, expected={expected} km"

def test_shyam_park_coordinates():
    df = algo_service.df
    shyam_park = df[df["Station Name"] == "Shyam park"].iloc[0]
    lat = shyam_park["Latitude"]
    lng = shyam_park["Longitude"]
    
    assert abs(lat - 28.6782) < 0.01
    assert abs(lng - 77.3709) < 0.01

def test_lal_quila_coordinates():
    df = algo_service.df
    lal_quila = df[df["Station Name"] == "Lal Quila"].iloc[0]
    lat = lal_quila["Latitude"]
    lng = lal_quila["Longitude"]
    
    assert abs(lat - 28.6567) < 0.01
    assert abs(lng - 77.2367) < 0.01
