from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import get_current_user
from app.schemas.user import (
    SavedPassengerBase,
    SavedPassengerResponse,
    UserLoginRequest,
    UserProfileResponse,
    UserRegisterRequest,
    UserUpdateRequest,
)
from app.services.auth_service import (
    add_saved_passenger,
    authenticate_user,
    delete_saved_passenger,
    get_user_profile,
    list_saved_passengers,
    register_user,
    update_user_profile,
)

router = APIRouter(prefix="/api/auth")


@router.post("/register")
async def register(data: UserRegisterRequest):
    try:
        return await register_user(data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/login")
async def login(data: UserLoginRequest):
    try:
        return await authenticate_user(data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


@router.get("/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)) -> UserProfileResponse:
    try:
        return await get_user_profile(int(current_user["user_id"]))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.put("/me")
async def update_me(payload: UserUpdateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        return await update_user_profile(int(current_user["user_id"]), payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/saved-passengers")
async def list_passengers(current_user: Dict[str, Any] = Depends(get_current_user)) -> List[SavedPassengerResponse]:
    return await list_saved_passengers(int(current_user["user_id"]))


@router.post("/saved-passengers")
async def create_passenger(
    payload: SavedPassengerBase,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> SavedPassengerResponse:
    return await add_saved_passenger(int(current_user["user_id"]), payload)


@router.delete("/saved-passengers/{passenger_id}")
async def delete_passenger(passenger_id: str, current_user: Dict[str, Any] = Depends(get_current_user)) -> dict:
    await delete_saved_passenger(int(current_user["user_id"]), passenger_id)
    return {"message": "Saved passenger removed"}


@router.post("/logout")
async def logout() -> dict:
    return {"message": "Logged out successfully"}
