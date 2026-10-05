from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.train import TrainResponse, TrainSearchParams
from app.services.train_service import get_all_trains, get_route_stops, get_train_by_id_or_number, search_trains

router = APIRouter(prefix="/api/trains")


@router.get("")
async def list_trains() -> List[TrainResponse]:
    return await get_all_trains()


@router.get("/search")
async def search_trains_endpoint(
    fromStation: Optional[str] = Query(default=None),
    toStation: Optional[str] = Query(default=None),
    journeyDate: Optional[str] = Query(default=None),
    classCode: Optional[str] = Query(default=None),
    passengersCount: int = Query(default=1),
) -> List[TrainResponse]:
    if not fromStation or not toStation or not journeyDate:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="fromStation, toStation and journeyDate are required")
    trains = await search_trains(
        TrainSearchParams(
            fromStation=fromStation,
            toStation=toStation,
            journeyDate=journeyDate,
            passengersCount=passengersCount,
            classCode=classCode or "ALL",
        )
    )
    if not trains:
        return []
    return trains


@router.get("/{train_id}")
async def get_train(train_id: str) -> TrainResponse:
    train = await get_train_by_id_or_number(train_id)
    if train is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Train not found")
    return train


@router.get("/{train_id}/route")
async def get_train_route(train_id: str) -> dict:
    train = await get_train_by_id_or_number(train_id)
    if train is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Train not found")
    return {"trainId": train.id, "route": await get_route_stops(train_id), "origin": train.fromStation, "destination": train.toStation}


@router.get("/{train_id}/fares")
async def get_train_fares(train_id: str) -> dict:
    train = await get_train_by_id_or_number(train_id)
    if train is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Train not found")
    return {"trainId": train.id, "classes": train.classes}


@router.get("/{train_id}/classes")
async def get_train_classes(train_id: str) -> dict:
    train = await get_train_by_id_or_number(train_id)
    if train is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Train not found")
    return {"trainId": train.id, "classes": train.classes}
