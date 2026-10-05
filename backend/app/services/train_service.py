from typing import List, Optional, Dict, Any
from datetime import datetime, date
from app.core.database import fetch_all, fetch_one, execute_commit
from app.schemas.train import (
    TrainResponse,
    TrainSearchParams,
    TrainCreate,
    TrainUpdate,
    StationBrief,
    TrainClassInfo,
    Amenity,
    RouteStopResponse,
)

DAYS_MAP = {1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"}
DAYS_REV = {
    "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6, "SUN": 7,
    "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 7,
}

TYPE_DISPLAY = {
    "VANDE_BHARAT": "Vande Bharat",
    "RAJDHANI": "Rajdhani",
    "SHATABDI": "Shatabdi",
    "DURONTO": "Duronto",
    "SUPERFAST": "Superfast",
    "EXPRESS": "Express",
    "HUMSAFAR": "Humsafar",
    "INTERCITY": "Intercity",
}


def _display_type(train_type: str) -> str:
    key = (train_type or "").upper().replace(" ", "_")
    return TYPE_DISPLAY.get(key, train_type.replace("_", " ").title() if train_type else "Express")


def _db_type(train_type: str) -> str:
    key = (train_type or "").upper().replace(" ", "_")
    if key in TYPE_DISPLAY:
        return key
    return "EXPRESS"

CLASS_NAMES = {
    "1A": "AC First Class",
    "2A": "AC 2 Tier",
    "3A": "AC 3 Tier",
    "SL": "Sleeper Class",
    "CC": "AC Chair Car",
    "EC": "Executive Chair Car",
    "2S": "Second Sitting",
}

CLASS_PREFIXES = {
    "1A": "H",
    "2A": "A",
    "3A": "B",
    "SL": "S",
    "CC": "C",
    "EC": "E",
    "2S": "D",
}


def _get_amenities_for_type(train_type: str) -> List[Amenity]:
    tt = (train_type or "").upper().replace(" ", "_")
    premium = tt in ["VANDE_BHARAT", "RAJDHANI", "SHATABDI"]
    return [
        Amenity(id="wifi", label="High-Speed Wi-Fi", available=premium),
        Amenity(id="food", label="Onboard Catering", available=True),
        Amenity(id="charging", label="Power Sockets", available=True),
        Amenity(id="bedding", label="Bedding", available=tt not in ["SHATABDI", "VANDE_BHARAT"]),
        Amenity(id="ac", label="Air Conditioned", available=True),
        Amenity(id="water", label="Drinking Water", available=True),
    ]


def _format_time(t: Any) -> str:
    if not t:
        return "00:00"
    if isinstance(t, str):
        return t[:5]
    return t.strftime("%H:%M")


def _format_duration(minutes: int) -> str:
    h = minutes // 60
    m = minutes % 60
    return f"{h}h {m}m"


async def search_trains(params: TrainSearchParams) -> List[TrainResponse]:
    from_code = params.fromStation.strip().upper() if params.fromStation else None
    to_code = params.toStation.strip().upper() if params.toStation else None
    journey_date_str = params.journeyDate or date.today().isoformat()
    journey_date_value = datetime.strptime(journey_date_str, "%Y-%m-%d").date()
    
    # Try parsing date to get day of week (Monday=1, Sunday=7)
    try:
        j_date = datetime.strptime(journey_date_str, "%Y-%m-%d").date()
        target_day = j_date.isoweekday()
    except Exception:
        target_day = None

    where_clauses = ["t.is_active = TRUE"]
    query_params: Dict[str, Any] = {}

    if from_code and to_code:
        # Route sequence matching
        query = """
            SELECT DISTINCT 
                t.train_id,
                t.train_number,
                t.train_name,
                t.train_type,
                src_st.station_code AS from_code,
                src_st.station_name AS from_name,
                src_st.city AS from_city,
                dst_st.station_code AS to_code,
                dst_st.station_name AS to_name,
                dst_st.city AS to_city,
                r_src.departure_time,
                r_dst.arrival_time,
                (
                    (r_dst.day_offset - r_src.day_offset) * 1440
                    + EXTRACT(HOUR FROM r_dst.arrival_time)::INTEGER * 60
                    + EXTRACT(MINUTE FROM r_dst.arrival_time)::INTEGER
                    - (EXTRACT(HOUR FROM r_src.departure_time)::INTEGER * 60
                       + EXTRACT(MINUTE FROM r_src.departure_time)::INTEGER)
                ) AS duration_minutes,
                (r_dst.distance_from_origin_km - r_src.distance_from_origin_km) AS distance_km
            FROM trains t
            JOIN train_routes r_src ON r_src.train_id = t.train_id
            JOIN stations src_st ON src_st.station_id = r_src.station_id
            JOIN train_routes r_dst ON r_dst.train_id = t.train_id
            JOIN stations dst_st ON dst_st.station_id = r_dst.station_id
            WHERE t.is_active = TRUE
              AND UPPER(src_st.station_code) = :from_code
              AND UPPER(dst_st.station_code) = :to_code
              AND r_src.sequence_no < r_dst.sequence_no
        """
        query_params["from_code"] = from_code
        query_params["to_code"] = to_code
        if target_day:
            query += " AND EXISTS (SELECT 1 FROM train_operating_days od WHERE od.train_id = t.train_id AND od.day_of_week = :day)"
            query_params["day"] = target_day
    else:
        # Return all active trains with origin and destination
        query = """
            SELECT 
                t.train_id,
                t.train_number,
                t.train_name,
                t.train_type,
                src_st.station_code AS from_code,
                src_st.station_name AS from_name,
                src_st.city AS from_city,
                dst_st.station_code AS to_code,
                dst_st.station_name AS to_name,
                dst_st.city AS to_city,
                r_src.departure_time,
                r_dst.arrival_time,
                (
                    (r_dst.day_offset - r_src.day_offset) * 1440
                    + EXTRACT(HOUR FROM r_dst.arrival_time)::INTEGER * 60
                    + EXTRACT(MINUTE FROM r_dst.arrival_time)::INTEGER
                    - (EXTRACT(HOUR FROM r_src.departure_time)::INTEGER * 60
                       + EXTRACT(MINUTE FROM r_src.departure_time)::INTEGER)
                ) AS duration_minutes,
                r_dst.distance_from_origin_km AS distance_km
            FROM trains t
            JOIN train_routes r_src ON r_src.train_id = t.train_id AND r_src.sequence_no = 1
            JOIN stations src_st ON src_st.station_id = r_src.station_id
            JOIN train_routes r_dst ON r_dst.train_id = t.train_id AND r_dst.sequence_no = (
                SELECT MAX(sequence_no) FROM train_routes WHERE train_id = t.train_id
            )
            JOIN stations dst_st ON dst_st.station_id = r_dst.station_id
            WHERE t.is_active = TRUE
        """

    train_rows = await fetch_all(query, query_params)
    results: List[TrainResponse] = []

    for tr in train_rows:
        tid = tr["train_id"]

        # Fetch operating days
        days_rows = await fetch_all(
            "SELECT day_of_week FROM train_operating_days WHERE train_id = :tid ORDER BY day_of_week",
            {"tid": tid}
        )
        op_days = [DAYS_MAP.get(r["day_of_week"], "DAILY") for r in days_rows]
        if not op_days:
            op_days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

        # Fetch classes and fares
        fares_query = """
            SELECT 
                f.class_code,
                f.full_route_fare,
                COALESCE(SUM(c.capacity), 72) AS capacity
            FROM fares f
            LEFT JOIN coaches c ON c.train_id = f.train_id AND c.coach_type = f.class_code AND c.is_active = TRUE
            WHERE f.train_id = :tid AND f.is_active = TRUE
            GROUP BY f.class_code, f.full_route_fare
            ORDER BY f.full_route_fare DESC
        """
        fares_rows = await fetch_all(fares_query, {"tid": tid})

        classes: List[TrainClassInfo] = []
        for fr in fares_rows:
            cc = fr["class_code"]
            base_fare = float(fr["full_route_fare"])

            # Check availability if possible
            avail_sql = """
                SELECT COUNT(DISTINCT sr.seat_id) AS booked
                FROM seat_reservations sr
                JOIN seats s ON s.seat_id = sr.seat_id
                JOIN coaches co ON co.coach_id = s.coach_id
                WHERE co.train_id = :tid 
                  AND co.coach_type = :cc
                  AND sr.journey_date = :jdate
                  AND sr.status = 'RESERVED'
            """
            try:
                booked_row = await fetch_one(avail_sql, {"tid": tid, "cc": cc, "jdate": journey_date_value})
                booked_seats = booked_row["booked"] if booked_row else 0
            except Exception:
                booked_seats = 0

            total_seats = int(fr["capacity"] or 72)
            avail = max(0, total_seats - booked_seats)

            status = "AVAILABLE" if avail > 10 else ("LIMITED" if avail > 0 else "WAITLIST")
            classes.append(
                TrainClassInfo(
                    code=cc,
                    name=CLASS_NAMES.get(cc, cc),
                    baseFare=base_fare,
                    seatsAvailable=avail,
                    status=status,
                    coachPrefix=CLASS_PREFIXES.get(cc, "B")
                )
            )

        dur_mins = tr["duration_minutes"] if tr["duration_minutes"] and tr["duration_minutes"] > 0 else 300
        dist_km = float(tr["distance_km"]) if tr["distance_km"] and tr["distance_km"] > 0 else 500.0

        train_resp = TrainResponse(
            id=str(tid),
            number=str(tr["train_number"]).zfill(5),
            name=tr["train_name"],
            type=_display_type(tr["train_type"]),
            fromStation=StationBrief(
                code=tr["from_code"],
                name=tr["from_name"],
                city=tr["from_city"]
            ),
            toStation=StationBrief(
                code=tr["to_code"],
                name=tr["to_name"],
                city=tr["to_city"]
            ),
            departureTime=_format_time(tr["departure_time"]),
            arrivalTime=_format_time(tr["arrival_time"]),
            duration=_format_duration(dur_mins),
            distanceKm=dist_km,
            operatingDays=op_days,
            classes=classes,
            amenities=_get_amenities_for_type(tr["train_type"]),
            status="ON_TIME",
            delayMinutes=0,
            pantryAvailable=True
        )
        results.append(train_resp)

    return results


async def get_all_trains() -> List[TrainResponse]:
    return await search_trains(TrainSearchParams())


async def get_train_by_id_or_number(identifier: str) -> Optional[TrainResponse]:
    # Check if identifier is numeric
    try:
        t_num = int(identifier)
        query = "SELECT train_id FROM trains WHERE (train_id = :tid OR train_number = :tnum) AND is_active = TRUE"
        row = await fetch_one(query, {"tid": t_num, "tnum": t_num})
    except ValueError:
        query = "SELECT train_id FROM trains WHERE UPPER(train_name) = UPPER(:tname) AND is_active = TRUE"
        row = await fetch_one(query, {"tname": identifier.strip()})

    if not row:
        return None

    tid = row["train_id"]
    # Get origin & destination stations
    orig_dst = await fetch_one("""
        SELECT 
            src_st.station_code AS from_code,
            dst_st.station_code AS to_code
        FROM train_routes r_src
        JOIN stations src_st ON src_st.station_id = r_src.station_id
        JOIN train_routes r_dst ON r_dst.train_id = r_src.train_id AND r_dst.sequence_no = (
            SELECT MAX(sequence_no) FROM train_routes WHERE train_id = :tid
        )
        JOIN stations dst_st ON dst_st.station_id = r_dst.station_id
        WHERE r_src.train_id = :tid AND r_src.sequence_no = 1
    """, {"tid": tid})

    params = TrainSearchParams(
        fromStation=orig_dst["from_code"] if orig_dst else None,
        toStation=orig_dst["to_code"] if orig_dst else None
    )
    all_matching = await search_trains(params)
    for t in all_matching:
        if t.id == str(tid):
            return t
    return None


async def get_route_stops(identifier: str) -> List[RouteStopResponse]:
    try:
        t_num = int(identifier)
        t_row = await fetch_one("SELECT train_id FROM trains WHERE train_id = :tid OR train_number = :tnum", {"tid": t_num, "tnum": t_num})
    except ValueError:
        t_row = await fetch_one("SELECT train_id FROM trains WHERE UPPER(train_name) = UPPER(:name)", {"name": identifier.strip()})

    if not t_row:
        return []

    tid = t_row["train_id"]
    sql = """
        SELECT 
            s.station_code,
            s.station_name,
            tr.arrival_time,
            tr.departure_time,
            tr.distance_from_origin_km,
            tr.day_offset,
            tr.sequence_no
        FROM train_routes tr
        JOIN stations s ON s.station_id = tr.station_id
        WHERE tr.train_id = :tid
        ORDER BY tr.sequence_no ASC
    """
    rows = await fetch_all(sql, {"tid": tid})
    stops: List[RouteStopResponse] = []

    for r in rows:
        arr_str = _format_time(r["arrival_time"]) if r["arrival_time"] else "--"
        dep_str = _format_time(r["departure_time"]) if r["departure_time"] else "--"
        
        halt = 0
        if r["arrival_time"] and r["departure_time"]:
            try:
                arr_m = r["arrival_time"].hour * 60 + r["arrival_time"].minute
                dep_m = r["departure_time"].hour * 60 + r["departure_time"].minute
                halt = max(0, dep_m - arr_m)
            except Exception:
                halt = 2

        stops.append(
            RouteStopResponse(
                stationCode=r["station_code"],
                stationName=r["station_name"],
                arrivalTime=arr_str,
                departureTime=dep_str,
                haltMinutes=halt,
                distanceKm=float(r["distance_from_origin_km"] or 0),
                day=int(r["day_offset"] or 0) + 1,
                sequence=int(r["sequence_no"])
            )
        )
    return stops


async def create_train(data: TrainCreate) -> TrainResponse:
    from_code = (data.fromStationCode or (data.fromStation.code if data.fromStation else "")).upper().strip()
    to_code = (data.toStationCode or (data.toStation.code if data.toStation else "")).upper().strip()
    if not from_code or not to_code:
        raise ValueError("Origin and destination station codes are required.")

    src = await fetch_one(
        "SELECT station_id FROM stations WHERE UPPER(station_code) = :code AND is_active = TRUE",
        {"code": from_code},
    )
    dst = await fetch_one(
        "SELECT station_id FROM stations WHERE UPPER(station_code) = :code AND is_active = TRUE",
        {"code": to_code},
    )
    if not src or not dst:
        raise ValueError("Origin or destination station was not found.")

    insert_sql = """
        INSERT INTO trains (train_number, train_name, train_type, is_active)
        VALUES (:num, :name, :type, TRUE)
        RETURNING train_id
    """
    row = await fetch_one(insert_sql, {
        "num": int(data.number),
        "name": data.name.strip(),
        "type": _db_type(data.type),
    })
    tid = row["train_id"]

    dep = data.departureTime[:5] if data.departureTime else "06:00"
    arr = data.arrivalTime[:5] if data.arrivalTime else "18:00"

    await execute_commit(
        """
        INSERT INTO train_routes (
            train_id, station_id, sequence_no, arrival_time, departure_time,
            day_offset, distance_from_origin_km
        )
        VALUES
            (:tid, :src, 1, NULL, CAST(:dep AS TIME), 0, 0),
            (:tid, :dst, 2, CAST(:arr AS TIME), NULL, 0, :dist)
        """,
        {"tid": tid, "src": src["station_id"], "dst": dst["station_id"], "dep": dep, "arr": arr, "dist": data.distanceKm or 0},
    )

    days = data.operatingDays or ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for day_str in days:
        day_num = DAYS_REV.get(day_str, DAYS_REV.get(day_str.upper()[:3], 1))
        await execute_commit(
            "INSERT INTO train_operating_days (train_id, day_of_week) VALUES (:tid, :day) ON CONFLICT DO NOTHING",
            {"tid": tid, "day": day_num},
        )

    fare_rows = data.classes or []
    if fare_rows:
        for cls in fare_rows:
            await execute_commit(
                """
                INSERT INTO fares (train_id, class_code, full_route_fare)
                VALUES (:tid, :cc, :fare)
                ON CONFLICT (train_id, class_code) DO UPDATE SET full_route_fare = EXCLUDED.full_route_fare
                """,
                {"tid": tid, "cc": cls.code.upper(), "fare": cls.baseFare},
            )
    else:
        base = data.baseFare or 1200.0
        await execute_commit(
            "INSERT INTO fares (train_id, class_code, full_route_fare) VALUES (:tid, '3A', :fare) ON CONFLICT DO NOTHING",
            {"tid": tid, "fare": base},
        )
        await execute_commit(
            "INSERT INTO fares (train_id, class_code, full_route_fare) VALUES (:tid, 'SL', :fare) ON CONFLICT DO NOTHING",
            {"tid": tid, "fare": base * 0.4},
        )

    created = await get_train_by_id_or_number(str(tid))
    if not created:
        raise ValueError("Train was created but could not be loaded.")
    return created


async def update_train(identifier: str, data: TrainUpdate) -> Optional[TrainResponse]:
    t = await get_train_by_id_or_number(identifier)
    if not t:
        return None

    tid = int(t.id)
    if data.name:
        await execute_commit("UPDATE trains SET train_name = :name, updated_at = NOW() WHERE train_id = :tid", {"name": data.name, "tid": tid})
    if data.type:
        await execute_commit("UPDATE trains SET train_type = :type, updated_at = NOW() WHERE train_id = :tid", {"type": _db_type(data.type), "tid": tid})

    if data.fromStationCode:
        source = await fetch_one(
            "SELECT station_id FROM stations WHERE UPPER(station_code) = UPPER(:code) AND is_active = TRUE",
            {"code": data.fromStationCode.strip()},
        )
        if not source:
            raise ValueError("Origin station was not found.")
        await execute_commit(
            "UPDATE train_routes SET station_id = :sid WHERE train_id = :tid AND sequence_no = (SELECT MIN(sequence_no) FROM train_routes WHERE train_id = :tid)",
            {"sid": source["station_id"], "tid": tid},
        )

    if data.toStationCode:
        destination = await fetch_one(
            "SELECT station_id FROM stations WHERE UPPER(station_code) = UPPER(:code) AND is_active = TRUE",
            {"code": data.toStationCode.strip()},
        )
        if not destination:
            raise ValueError("Destination station was not found.")
        await execute_commit(
            "UPDATE train_routes SET station_id = :sid WHERE train_id = :tid AND sequence_no = (SELECT MAX(sequence_no) FROM train_routes WHERE train_id = :tid)",
            {"sid": destination["station_id"], "tid": tid},
        )

    if data.departureTime:
        await execute_commit(
            "UPDATE train_routes SET departure_time = CAST(:value AS TIME) WHERE train_id = :tid AND sequence_no = (SELECT MIN(sequence_no) FROM train_routes WHERE train_id = :tid)",
            {"value": data.departureTime[:5], "tid": tid},
        )

    if data.arrivalTime:
        await execute_commit(
            "UPDATE train_routes SET arrival_time = CAST(:value AS TIME) WHERE train_id = :tid AND sequence_no = (SELECT MAX(sequence_no) FROM train_routes WHERE train_id = :tid)",
            {"value": data.arrivalTime[:5], "tid": tid},
        )

    if data.distanceKm is not None:
        await execute_commit(
            "UPDATE train_routes SET distance_from_origin_km = :distance WHERE train_id = :tid AND sequence_no = (SELECT MAX(sequence_no) FROM train_routes WHERE train_id = :tid)",
            {"distance": data.distanceKm, "tid": tid},
        )

    if data.operatingDays:
        await execute_commit("DELETE FROM train_operating_days WHERE train_id = :tid", {"tid": tid})
        for day_str in data.operatingDays:
            day_num = DAYS_REV.get(day_str.upper(), 1)
            await execute_commit(
                "INSERT INTO train_operating_days (train_id, day_of_week) VALUES (:tid, :day) ON CONFLICT DO NOTHING",
                {"tid": tid, "day": day_num}
            )

    return await get_train_by_id_or_number(str(tid))


async def delete_train(identifier: str) -> bool:
    try:
        t_num = int(identifier)
        await execute_commit("UPDATE trains SET is_active = FALSE, updated_at = NOW() WHERE train_id = :tid OR train_number = :tnum", {"tid": t_num, "tnum": t_num})
    except ValueError:
        await execute_commit("UPDATE trains SET is_active = FALSE, updated_at = NOW() WHERE UPPER(train_name) = UPPER(:name)", {"name": identifier.strip()})
    return True
