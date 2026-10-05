import json
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from app.core.database import fetch_all, fetch_one, execute_commit
from app.schemas.booking import (
    BookingCreateRequest,
    BookingResponse,
    PassengerResponse,
    FareBreakdown,
    PaymentDetails,
    TrainBrief,
)
from app.schemas.train import StationBrief


def _map_booking_status(status: Optional[str]) -> str:
    raw = (status or "CONFIRMED").upper()
    return {
        "WAITLIST": "WAITLISTED",
        "PENDING": "CONFIRMED",
        "FAILED": "CANCELLED",
    }.get(raw, raw)


def _format_time(t: Any) -> str:
    if not t:
        return "00:00"
    if isinstance(t, str):
        return t[:5]
    return t.strftime("%H:%M")


async def create_booking(data: BookingCreateRequest, user_id: Optional[int] = None) -> BookingResponse:
    try:
        journey_date = datetime.strptime(data.journeyDate, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError("journeyDate must be a valid ISO date (YYYY-MM-DD).") from exc

    # 1. Resolve user_id
    if not user_id:
        if data.userId:
            try:
                user_id = int(data.userId)
            except ValueError:
                user_id = None
    if not user_id:
        # Fallback to first user or demo user
        demo_u = await fetch_one("SELECT user_id FROM users WHERE email = :email", {"email": data.userEmail.lower().strip()})
        if demo_u:
            user_id = demo_u["user_id"]
        else:
            first_u = await fetch_one("SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1")
            user_id = first_u["user_id"] if first_u else 1

    # 2. Resolve train_id
    train_row = await fetch_one(
        "SELECT train_id, train_number, train_name, train_type FROM trains WHERE train_number = :num OR train_id = :tid",
        {"num": int(data.train.number) if data.train.number.isdigit() else 0, "tid": int(data.train.id) if data.train.id.isdigit() else 0}
    )
    if not train_row:
        raise ValueError(f"Train {data.train.name} not found.")
    train_id = train_row["train_id"]

    # 3. Resolve source & destination station IDs from the selected journey when possible
    from_code = data.train.fromStation.code if data.train.fromStation else None
    to_code = data.train.toStation.code if data.train.toStation else None

    src_row = None
    dst_row = None
    if from_code:
        src_row = await fetch_one(
            """
            SELECT s.station_id, s.station_code, s.station_name, s.city
            FROM stations s
            JOIN train_routes r ON r.station_id = s.station_id
            WHERE r.train_id = :tid AND UPPER(s.station_code) = UPPER(:code)
            """,
            {"tid": train_id, "code": from_code},
        )
    if to_code:
        dst_row = await fetch_one(
            """
            SELECT s.station_id, s.station_code, s.station_name, s.city
            FROM stations s
            JOIN train_routes r ON r.station_id = s.station_id
            WHERE r.train_id = :tid AND UPPER(s.station_code) = UPPER(:code)
            """,
            {"tid": train_id, "code": to_code},
        )
    if not src_row:
        src_row = await fetch_one(
            "SELECT station_id, station_code, station_name, city FROM stations WHERE station_id = ("
            "  SELECT station_id FROM train_routes WHERE train_id = :tid ORDER BY sequence_no ASC LIMIT 1"
            ")", {"tid": train_id}
        )
    if not dst_row:
        dst_row = await fetch_one(
            "SELECT station_id, station_code, station_name, city FROM stations WHERE station_id = ("
            "  SELECT station_id FROM train_routes WHERE train_id = :tid ORDER BY sequence_no DESC LIMIT 1"
            ")", {"tid": train_id}
        )
    source_id = src_row["station_id"] if src_row else 1
    dest_id = dst_row["station_id"] if dst_row else 2

    # 4. Find available seats for these passengers
    num_passengers = len(data.passengers)
    avail_seats = await fetch_all("""
        SELECT s.seat_id, c.coach_number, s.seat_number, s.seat_type
        FROM seats s
        JOIN coaches c ON c.coach_id = s.coach_id
        WHERE c.train_id = :tid
          AND c.coach_type = :cc
          AND c.is_active = TRUE
          AND NOT EXISTS (
              SELECT 1 FROM seat_reservations sr
              WHERE sr.seat_id = s.seat_id
                AND sr.journey_date = :jdate
                AND sr.status = 'RESERVED'
          )
        ORDER BY c.coach_number, s.seat_number
        LIMIT :limit
        """, {"tid": train_id, "cc": data.classCode.upper(), "jdate": journey_date, "limit": num_passengers})

    if len(avail_seats) < num_passengers:
        raise ValueError(f"Not enough seats available in class {data.classCode} for this date.")

    # 5. Build passengers JSONB payload
    allowed_prefs = {"LOWER", "MIDDLE", "UPPER", "SIDE_LOWER", "SIDE_UPPER", "WINDOW", "AISLE"}
    passengers_payload = []
    for i, p in enumerate(data.passengers):
        seat = avail_seats[i]
        raw_pref = (p.seatPreference or "").upper().replace(" ", "_")
        seat_pref = raw_pref if raw_pref in allowed_prefs else None
        passengers_payload.append({
            "full_name": p.fullName,
            "age": p.age,
            "gender": p.gender.upper(),
            "nationality": p.nationality or "Indian",
            "id_type": p.idType or "AADHAAR",
            "id_number": p.idNumber or "XXXX-1234",
            "class_code": data.classCode.upper(),
            "seat_id": seat["seat_id"],
            "seat_preference": seat_pref,
        })

    # 6. Execute atomic create_booking stored function
    call_sql = """
        SELECT booking_id, pnr, total_fare
        FROM create_booking(
            :user_id,
            :train_id,
            :source_id,
            :dest_id,
            CAST(:journey_date AS DATE),
            :email,
            :phone,
            CAST(:passengers AS JSONB),
            :payment_method
        )
    """
    res = await fetch_one(call_sql, {
        "user_id": user_id,
        "train_id": train_id,
        "source_id": source_id,
        "dest_id": dest_id,
        "journey_date": journey_date,
        "email": data.userEmail,
        "phone": data.payment.upiId or "9876543210",
        "passengers": json.dumps(passengers_payload),
        "payment_method": data.payment.method or "UPI"
    })

    new_pnr = res["pnr"]
    return await get_booking_by_pnr(new_pnr)


async def get_booking_by_pnr(pnr: str) -> Optional[BookingResponse]:
    rows = await fetch_all("""
        SELECT 
            booking_id,
            pnr,
            journey_date,
            booking_status,
            total_fare,
            booking_date,
            user_id,
            booked_by,
            user_email,
            train_number,
            train_name,
            train_type,
            source_code,
            source_station,
            destination_code,
            destination_station,
            passenger_id,
            passenger_name,
            age,
            gender,
            class_code,
            fare_amount,
            seat_number,
            coach_number,
            payment_method,
            payment_status,
            transaction_ref
        FROM v_booking_details
        WHERE UPPER(pnr) = UPPER(:pnr)
    """, {"pnr": pnr.strip()})

    if not rows:
        return None

    first = rows[0]
    passengers: List[PassengerResponse] = []
    for r in rows:
        c_num = r["coach_number"] or "B1"
        s_num = str(r["seat_number"] or "12")
        passengers.append(
            PassengerResponse(
                id=str(r["passenger_id"]),
                fullName=r["passenger_name"],
                age=r["age"],
                gender=r["gender"],
                allocatedCoach=c_num,
                allocatedSeat=s_num,
                allocatedBerth="Lower Berth" if int(s_num) % 3 == 1 else "Upper Berth"
            )
        )

    tot = float(first["total_fare"] or 0)
    base = tot * 0.82
    res_fee = 40.0
    gst = tot * 0.05
    sup = 45.0
    cat = max(0.0, tot - base - res_fee - gst - sup)

    return BookingResponse(
        id=str(first["booking_id"]),
        pnr=first["pnr"],
        userId=str(first["user_id"]),
        userEmail=first["user_email"],
        userName=first["booked_by"],
        train=TrainBrief(
            id=str(first["train_number"]),
            number=str(first["train_number"]).zfill(5),
            name=first["train_name"],
            type=first["train_type"]
        ),
        fromStation=StationBrief(
            code=first["source_code"],
            name=first["source_station"],
            city=first["source_station"]
        ),
        toStation=StationBrief(
            code=first["destination_code"],
            name=first["destination_station"],
            city=first["destination_station"]
        ),
        journeyDate=first["journey_date"].isoformat() if hasattr(first["journey_date"], "isoformat") else str(first["journey_date"]),
        departureTime="06:00",
        arrivalTime="14:15",
        duration="8h 15m",
        classCode=first["class_code"] or "3A",
        coachNumber=first["coach_number"] or "B1",
        passengers=passengers,
        fareBreakdown=FareBreakdown(
            baseFare=round(base, 2),
            reservationFee=res_fee,
            superfastCharge=sup,
            gst=round(gst, 2),
            cateringCharge=round(cat, 2),
            total=round(tot, 2)
        ),
        payment=PaymentDetails(
            method=first["payment_method"] or "UPI",
            transactionId=first["transaction_ref"] or f"TXN-{first['pnr']}",
            timestamp=datetime.now().isoformat(),
            status=first["payment_status"] or "SUCCESS"
        ),
        status=_map_booking_status(first["booking_status"]),
        bookingDate=first["booking_date"].isoformat() if hasattr(first["booking_date"], "isoformat") else str(first["booking_date"]),
        platform="02"
    )


async def get_user_bookings(user_id: int) -> List[BookingResponse]:
    pnr_rows = await fetch_all(
        "SELECT DISTINCT pnr FROM bookings WHERE user_id = :uid ORDER BY pnr DESC",
        {"uid": user_id}
    )
    bookings = []
    for r in pnr_rows:
        b = await get_booking_by_pnr(r["pnr"])
        if b:
            bookings.append(b)
    return bookings


async def get_all_bookings() -> List[BookingResponse]:
    pnr_rows = await fetch_all(
        "SELECT pnr FROM bookings ORDER BY created_at DESC LIMIT 200"
    )
    bookings = []
    for r in pnr_rows:
        b = await get_booking_by_pnr(r["pnr"])
        if b:
            bookings.append(b)
    return bookings


async def get_upcoming_booking(user_id: int) -> Optional[BookingResponse]:
    row = await fetch_one(
        """
        SELECT pnr
        FROM bookings
        WHERE user_id = :uid
          AND status = 'CONFIRMED'
          AND journey_date >= CURRENT_DATE
        ORDER BY journey_date ASC
        LIMIT 1
        """,
        {"uid": user_id},
    )
    if not row:
        return None
    return await get_booking_by_pnr(row["pnr"])


async def update_booking_status(pnr: str, status: str) -> BookingResponse:
    mapped = {
        "WAITLISTED": "WAITLIST",
        "COMPLETED": "CONFIRMED",
    }.get(status.upper(), status.upper())
    if mapped == "CANCELLED":
        return await cancel_booking(pnr, "Administrator cancelled booking")
    await execute_commit(
        "UPDATE bookings SET status = :st, updated_at = NOW() WHERE UPPER(pnr) = UPPER(:pnr)",
        {"st": mapped, "pnr": pnr.strip()},
    )
    booking = await get_booking_by_pnr(pnr)
    if not booking:
        raise ValueError("Booking not found")
    return booking


async def cancel_booking(pnr: str, reason: str = "User requested cancellation") -> BookingResponse:
    # Call stored procedure cancel_booking
    await execute_commit(
        "CALL cancel_booking(:pnr, :reason)",
        {"pnr": pnr.strip().upper(), "reason": reason}
    )
    return await get_booking_by_pnr(pnr)
