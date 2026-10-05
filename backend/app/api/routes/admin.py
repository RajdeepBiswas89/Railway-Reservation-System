from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import require_admin
from app.schemas.admin import AdminMetricsResponse, AdminReportResponse
from app.schemas.station import StationCreate, StationResponse, StationUpdate
from app.schemas.train import TrainCreate, TrainResponse, TrainUpdate
from app.services.admin_service import get_class_distribution, get_metrics, get_reports, get_revenue_trends
from app.services.booking_service import get_all_bookings
from app.services.station_service import create_station, delete_station, get_all_stations, update_station
from app.services.train_service import create_train, delete_train, get_all_trains, update_train

router = APIRouter()


@router.get("/metrics")
async def admin_metrics(current_user: Dict[str, Any] = Depends(require_admin)) -> AdminMetricsResponse:
    return await get_metrics()


@router.get("/trains")
async def list_admin_trains(current_user: Dict[str, Any] = Depends(require_admin)) -> List[TrainResponse]:
    return await get_all_trains()


@router.post("/trains")
async def create_admin_train(payload: TrainCreate, current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    try:
        return await create_train(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.put("/trains/{train_id}")
async def update_admin_train(train_id: str, payload: TrainUpdate, current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    try:
        train = await update_train(train_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if train is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Train not found")
    return train


@router.delete("/trains/{train_id}")
async def delete_admin_train(train_id: str, current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    await delete_train(train_id)
    return {"message": "Train deactivated"}


@router.get("/stations")
async def list_admin_stations(current_user: Dict[str, Any] = Depends(require_admin)) -> List[StationResponse]:
    return await get_all_stations()


@router.post("/stations")
async def create_admin_station(payload: StationCreate, current_user: Dict[str, Any] = Depends(require_admin)) -> StationResponse:
    return await create_station(payload)


@router.put("/stations/{station_id}")
async def update_admin_station(station_id: str, payload: StationUpdate, current_user: Dict[str, Any] = Depends(require_admin)) -> StationResponse:
    updated = await update_station(station_id, payload)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")
    return updated


@router.delete("/stations/{station_id}")
async def delete_admin_station(station_id: str, current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    await delete_station(station_id)
    return {"message": "Station deactivated"}


@router.get("/routes")
async def list_routes(current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    return {"routes": []}


@router.post("/routes")
async def create_route(current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    return {"message": "Route creation endpoint ready"}


@router.put("/routes/{route_id}")
async def update_route(route_id: str, current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    return {"message": f"Route {route_id} update endpoint ready"}


@router.delete("/routes/{route_id}")
async def delete_route(route_id: str, current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    return {"message": f"Route {route_id} deletion endpoint ready"}


@router.get("/coaches")
async def list_coaches(current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    return {"coaches": []}


@router.get("/seats")
async def list_seats(current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    return {"seats": []}


@router.get("/bookings")
async def list_booking_admin(current_user: Dict[str, Any] = Depends(require_admin)) -> list:
    return await get_all_bookings()


@router.get("/users")
async def list_users(current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    return {"users": []}


@router.get("/reports/overview")
async def report_overview(current_user: Dict[str, Any] = Depends(require_admin)) -> AdminMetricsResponse:
    return await get_metrics()


@router.get("/reports/bookings")
async def report_bookings(current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    return {"bookings": await get_all_bookings()}


@router.get("/reports/revenue")
async def report_revenue(current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    return {"revenue": await get_revenue_trends()}


@router.get("/reports/occupancy")
async def report_occupancy(current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    return {"occupancy": await get_class_distribution()}


@router.get("/reports/routes")
async def report_routes(current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    report = await get_reports("30D")
    return {"routes": report.topRoutes}


@router.get("/reports/cancellations")
async def report_cancellations(current_user: Dict[str, Any] = Depends(require_admin)) -> dict:
    report = await get_reports("30D")
    return {"cancellations": {"loss": report.cancellationLoss, "tickets": report.totalTicketsSold}}
