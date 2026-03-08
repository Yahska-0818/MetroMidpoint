import os
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from models import MeetRequest, RouteRequest, RouteResponse
from graph_loader import GraphLoader
from algorithm_service import AlgorithmService

CSV_URL = "https://raw.githubusercontent.com/sachinbajaj4477/Delhi-Metro-Network-Analysis/main/Delhi-Metro-Network.csv"

algo_service: AlgorithmService | None = None
graph = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global algo_service, graph
    loader = GraphLoader(CSV_URL)
    graph = loader.build_or_load_graph()
    algo_service = AlgorithmService(graph)
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"ready": algo_service is not None}

@app.get("/stations")
def list_stations() -> List[str]:
    if graph is None:
        raise HTTPException(status_code=503, detail="Server is still initializing")
    return sorted(list(graph.nodes))

@app.post("/find-midpoint")
def find_midpoint(req: MeetRequest):
    try:
        if algo_service is None:
            raise HTTPException(status_code=503, detail="Server is still initializing")
        return algo_service.find_best_midpoint(req.stations)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/route", response_model=RouteResponse)
def get_route(req: RouteRequest):
    try:
        if algo_service is None:
            raise HTTPException(status_code=503, detail="Server is still initializing")
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
