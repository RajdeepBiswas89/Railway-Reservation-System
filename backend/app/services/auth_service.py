from typing import List, Optional, Dict, Any
import json
from app.core.database import fetch_one, fetch_all, execute_commit
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.user import (
    UserLoginRequest,
    UserRegisterRequest,
    TokenResponse,
    UserProfileResponse,
    UserUpdateRequest,
    SavedPassengerBase,
    SavedPassengerResponse,
    UserPreferences,
    UserMetrics,
    AdminUserItem,
)


async def register_user(data: UserRegisterRequest) -> TokenResponse:
    # Check existing email
    existing = await fetch_one(
        "SELECT user_id FROM users WHERE LOWER(email) = LOWER(:email)",
        {"email": data.email.strip()}
    )
    if existing:
        raise ValueError("An account with this email address already exists.")

    hashed_pw = get_password_hash(data.password)
    sql = """
        INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
        VALUES (:name, LOWER(:email), :phone, :pw, 'USER', TRUE)
        RETURNING user_id, full_name, email, phone, role
    """
    row = await fetch_one(sql, {
        "name": data.fullName.strip(),
        "email": data.email.strip(),
        "phone": data.phone.strip(),
        "pw": hashed_pw
    })
    uid = row["user_id"]

    token = create_access_token(subject=str(uid))
    user_prof = await get_user_profile(uid)
    return TokenResponse(access_token=token, token_type="bearer", user=user_prof)


async def _password_matches(user_id: int, plain: str, hashed: str) -> bool:
    try:
        if hashed and verify_password(plain, hashed):
            return True
    except Exception:
        pass
    chk = await fetch_one(
        "SELECT (crypt(:pw, password_hash) = password_hash) AS ok FROM users WHERE user_id = :uid",
        {"pw": plain, "uid": user_id},
    )
    return bool(chk and chk.get("ok"))


async def authenticate_user(data: UserLoginRequest) -> TokenResponse:
    user = await fetch_one(
        "SELECT user_id, full_name, email, password_hash, role, is_active FROM users WHERE LOWER(email) = LOWER(:email)",
        {"email": data.email.strip()}
    )
    if not user or not user["is_active"]:
        raise ValueError("Invalid email or password.")

    if not await _password_matches(user["user_id"], data.password, user["password_hash"]):
        raise ValueError("Invalid email or password.")

    uid = user["user_id"]
    token = create_access_token(subject=str(uid))
    user_prof = await get_user_profile(uid)
    return TokenResponse(access_token=token, token_type="bearer", user=user_prof)


async def get_user_profile(user_id: int) -> UserProfileResponse:
    user = await fetch_one(
        "SELECT user_id, full_name, email, phone, role FROM users WHERE user_id = :uid",
        {"uid": user_id}
    )
    if not user:
        raise ValueError("User not found.")

    # Calculate metrics from bookings
    metrics_row = await fetch_one("""
        SELECT 
            COUNT(booking_id) AS total_journeys,
            COUNT(booking_id) FILTER (WHERE status = 'COMPLETED') AS completed_trips,
            COUNT(booking_id) FILTER (WHERE status = 'CONFIRMED' AND journey_date >= CURRENT_DATE) AS upcoming_trips,
            COALESCE(SUM(total_fare), 0) AS total_spent
        FROM bookings
        WHERE user_id = :uid
    """, {"uid": user_id})

    total_j = int(metrics_row["total_journeys"] or 0) if metrics_row else 0
    comp_t = int(metrics_row["completed_trips"] or 0) if metrics_row else 0
    upc_t = int(metrics_row["upcoming_trips"] or 0) if metrics_row else 0

    metrics = UserMetrics(
        totalJourneys=total_j,
        citiesVisited=min(12, max(2, total_j * 2)),
        completedTrips=comp_t,
        upcomingTrips=upc_t,
        savedKms=total_j * 450
    )

    # Saved passengers
    passengers_rows = await fetch_all(
        """
        SELECT saved_passenger_id, full_name, age, gender, id_type, id_number, preference
        FROM saved_passengers
        WHERE user_id = :uid
        ORDER BY saved_passenger_id DESC
        LIMIT 20
        """,
        {"uid": user_id},
    )
    if not passengers_rows:
        passengers_rows = await fetch_all("""
            SELECT DISTINCT ON (p.full_name)
                p.passenger_id AS saved_passenger_id,
                p.full_name,
                p.age,
                p.gender,
                COALESCE(p.id_type, 'AADHAAR') AS id_type,
                COALESCE(p.id_number, 'XXXX-XXXX') AS id_number,
                COALESCE(p.seat_preference, 'LOWER') AS preference
            FROM passengers p
            JOIN bookings b ON b.booking_id = p.booking_id
            WHERE b.user_id = :uid
            ORDER BY p.full_name, p.passenger_id DESC
            LIMIT 5
        """, {"uid": user_id})

    saved_p = [
        SavedPassengerResponse(
            id=str(r["saved_passenger_id"]),
            fullName=r["full_name"],
            age=int(r["age"]),
            gender=r["gender"],
            idType=r["id_type"] or "AADHAAR",
            idNumber=r["id_number"] or "XXXX-XXXX",
            preference=r["preference"] or "LOWER",
        ) for r in passengers_rows
    ]

    return UserProfileResponse(
        id=str(user["user_id"]),
        fullName=user["full_name"],
        email=user["email"],
        phone=user["phone"],
        role=user["role"],
        savedPassengers=saved_p,
        preferences=UserPreferences(),
        metrics=metrics
    )


async def update_user_profile(user_id: int, data: UserUpdateRequest) -> UserProfileResponse:
    if data.fullName:
        await execute_commit(
            "UPDATE users SET full_name = :name, updated_at = NOW() WHERE user_id = :uid",
            {"name": data.fullName.strip(), "uid": user_id}
        )
    if data.phone:
        await execute_commit(
            "UPDATE users SET phone = :phone, updated_at = NOW() WHERE user_id = :uid",
            {"phone": data.phone.strip(), "uid": user_id}
        )
    return await get_user_profile(user_id)


async def list_saved_passengers(user_id: int) -> List[SavedPassengerResponse]:
    profile = await get_user_profile(user_id)
    return profile.savedPassengers


async def add_saved_passenger(user_id: int, data: SavedPassengerBase) -> SavedPassengerResponse:
    row = await fetch_one(
        """
        INSERT INTO saved_passengers (user_id, full_name, age, gender, id_type, id_number, preference)
        VALUES (:uid, :name, :age, :gender, :id_type, :id_number, :pref)
        RETURNING saved_passenger_id, full_name, age, gender, id_type, id_number, preference
        """,
        {
            "uid": user_id,
            "name": data.fullName.strip(),
            "age": data.age,
            "gender": data.gender.upper(),
            "id_type": data.idType,
            "id_number": data.idNumber,
            "pref": data.preference or "LOWER",
        },
    )
    return SavedPassengerResponse(
        id=str(row["saved_passenger_id"]),
        fullName=row["full_name"],
        age=int(row["age"]),
        gender=row["gender"],
        idType=row["id_type"] or "AADHAAR",
        idNumber=row["id_number"] or "",
        preference=row["preference"] or "LOWER",
    )


async def delete_saved_passenger(user_id: int, passenger_id: str) -> None:
    await execute_commit(
        "DELETE FROM saved_passengers WHERE saved_passenger_id = :pid AND user_id = :uid",
        {"pid": int(passenger_id), "uid": user_id},
    )


async def list_users() -> List[AdminUserItem]:
    rows = await fetch_all(
        """
        SELECT
            u.user_id,
            u.full_name,
            u.email,
            u.phone,
            u.role,
            u.is_active,
            COUNT(b.booking_id) FILTER (WHERE b.status IN ('CONFIRMED', 'COMPLETED')) AS trips
        FROM users u
        LEFT JOIN bookings b ON b.user_id = u.user_id
        GROUP BY u.user_id
        ORDER BY u.user_id ASC
        """
    )
    return [
        AdminUserItem(
            id=str(r["user_id"]),
            name=r["full_name"],
            email=r["email"],
            phone=r["phone"],
            role=r["role"],
            trips=int(r["trips"] or 0),
            status="ADMIN" if r["role"] == "ADMIN" else ("VERIFIED" if r["is_active"] else "INACTIVE"),
        )
        for r in rows
    ]
