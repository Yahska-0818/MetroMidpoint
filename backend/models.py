from typing import List

from pydantic import BaseModel


class MeetRequest(BaseModel):
    stations: List[str]


class RouteRequest(BaseModel):
    source: str
    destination: str


class RouteStep(BaseModel):
    name: str
    line: str


class RouteResponse(BaseModel):
    path: List[RouteStep]
    total_time: float
    fare: int
    interchanges: int
