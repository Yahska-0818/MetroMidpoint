import os
from fastapi import FastAPI, HTTPException
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


@app.post("/find-midpoint")
def find_midpoint(req: MeetRequest):
    try:
        return algo_service.find_best_midpoint(req.stations)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/route", response_model=RouteResponse)
def get_route(req: RouteRequest):
    try:
        src_node = algo_service._resolve_station_name(req.source)
        dest_node = algo_service._resolve_station_name(req.destination)
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
            return FileResponse(f"dist/{full_path}")
        return FileResponse("dist/index.html")
