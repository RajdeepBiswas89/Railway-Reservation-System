from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_current_user
from app.schemas.booking import BookingCancelRequest, BookingCreateRequest, BookingResponse
from app.services.booking_service import cancel_booking, create_booking, get_booking_by_pnr, get_user_bookings

router = APIRouter(prefix="/api/bookings")


@router.post("")
async def create_new_booking(payload: BookingCreateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await create_booking(payload, user_id=int(current_user["user_id"]))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.get("/me")
async def list_my_bookings(current_user: Dict[str, Any] = Depends(get_current_user)) -> List[BookingResponse]:
    return await get_user_bookings(int(current_user["user_id"]))


@router.get("/{booking_id}")
async def get_booking_by_id(booking_id: str) -> BookingResponse:
    booking = await get_booking_by_pnr(booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking


@router.post("/{booking_id}/cancel")
async def cancel_booking_endpoint(
    booking_id: str,
    payload: BookingCancelRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> BookingResponse:
    try:
        existing = await get_booking_by_pnr(booking_id)
        if existing is None:
            raise ValueError("Booking not found")
        if current_user.get("role") != "ADMIN" and existing.userId != str(current_user["user_id"]):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot cancel another user's booking")
        booking = await cancel_booking(booking_id, reason=payload.reason or "User requested cancellation")
        return booking
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
