from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.station import StationResponse, StationSuggestionResponse
from app.services.station_service import get_all_stations, get_station_by_code, search_stations

router = APIRouter(prefix="/api/stations")


@router.get("")
async def list_stations() -> List[StationResponse]:
    return await get_all_stations()


@router.get("/search")
async def search_stations_endpoint(q: Optional[str] = Query(default=None, alias="query")) -> List[StationSuggestionResponse]:
    return await search_stations(q or "")


@router.get("/{station_id}")
async def get_station(station_id: str) -> StationResponse:
    station = None
    try:
        station = await get_station_by_code(station_id)
    except ValueError:
        station = None
    if station is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")
    return station
