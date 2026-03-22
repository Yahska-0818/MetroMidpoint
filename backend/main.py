import os
import math
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List
from models import MeetRequest, RouteRequest, RouteResponse
from graph_loader import GraphLoader
from algorithm_service import AlgorithmService

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

CSV_URL = "./metro_data.csv"
loader = GraphLoader(CSV_URL)
graph = loader.build_or_load_graph()
algo_service = AlgorithmService(graph, CSV_URL)


@app.get("/stations")
def list_stations() -> List[str]:
    return sorted(list(graph.nodes))


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2) + math.cos(math.radians(lat1)) * math.cos(
        math.radians(lat2)
    ) * (math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@app.get("/nearest-station")
def nearest_station(lat: float = Query(...), lng: float = Query(...)):
    df = algo_service.df
    
    valid_df = df.dropna(subset=['Latitude', 'Longitude'])
    
    if valid_df.empty:
        raise HTTPException(status_code=404, detail="No station coordinates available")

    distances = valid_df.apply(
        lambda row: haversine(lat, lng, row['Latitude'], row['Longitude']), 
        axis=1
    )
    
    nearest_idx = distances.idxmin()
    nearest_station_node = valid_df.loc[nearest_idx, 'Node Name']
    
    return {"station": nearest_station_node}


@app.post("/find-midpoint")
def find_midpoint(req: MeetRequest):
    try:
        return algo_service.find_best_midpoint(req.stations)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/route", response_model=RouteResponse)
def get_route(req: RouteRequest, optimize: str = Query("fastest", pattern="^(fastest|fewest_interchanges)$")):
    try:
        src_node = algo_service._resolve_station_name(req.source)
        dest_node = algo_service._resolve_station_name(req.destination)
        if optimize == "fewest_interchanges":
            return algo_service.get_route_details_least_interchanges(src_node, dest_node)
        return algo_service.get_route_details(src_node, dest_node)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if os.path.isdir("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path != "" and os.path.exists(f"dist/{full_path}"):
            response = FileResponse(f"dist/{full_path}")
            if full_path.startswith("assets/"):
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            return response
        return FileResponse("dist/index.html")
