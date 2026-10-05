from typing import List, Optional, Dict, Any
from app.core.database import fetch_all, fetch_one, execute_commit
from app.schemas.station import StationResponse, StationCreate, StationUpdate, StationSuggestionResponse


async def get_all_stations() -> List[StationResponse]:
    query = """
        SELECT 
            station_code AS code,
            station_name AS name,
            city,
            state,
            railway_zone AS zone,
            6 AS platforms,
            CASE WHEN is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status
        FROM stations
        WHERE is_active = TRUE
        ORDER BY station_name ASC
    """
    rows = await fetch_all(query)
    return [StationResponse(**row) for row in rows]


async def get_station_by_code(code: str) -> Optional[StationResponse]:
    query = """
        SELECT 
            station_code AS code,
            station_name AS name,
            city,
            state,
            railway_zone AS zone,
            6 AS platforms,
            CASE WHEN is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status
        FROM stations
        WHERE UPPER(station_code) = UPPER(:code)
    """
    row = await fetch_one(query, {"code": code.strip()})
    if not row:
        return None
    return StationResponse(**row)


async def search_stations(query_str: str) -> List[StationSuggestionResponse]:
    trimmed = (query_str or "").strip()
    if not trimmed:
        hubs = await fetch_all(
            """
            SELECT
                station_code AS code,
                station_name AS name,
                city,
                state,
                railway_zone AS zone,
                6 AS platforms,
                CASE WHEN is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status
            FROM stations
            WHERE is_active = TRUE
              AND station_code IN ('HWH', 'NDLS', 'CSMT', 'SBC', 'MAS', 'ADI', 'CNB', 'BBS', 'PUNE')
            ORDER BY station_name
            LIMIT 8
            """
        )
        return [
            StationSuggestionResponse(
                station=StationResponse(**r),
                matchedField="name",
                score=100,
                isHub=True,
            )
            for r in hubs
        ]
    q = f"%{query_str.strip()}%"
    code_exact = query_str.strip().upper()
    sql = """
        SELECT 
            station_code AS code,
            station_name AS name,
            city,
            state,
            railway_zone AS zone,
            6 AS platforms,
            CASE WHEN is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status,
            CASE 
                WHEN UPPER(station_code) = :code_exact THEN 'code'
                WHEN station_name ILIKE :q THEN 'name'
                WHEN city ILIKE :q THEN 'city'
                ELSE 'state'
            END AS matched_field,
            CASE 
                WHEN UPPER(station_code) = :code_exact THEN 100
                WHEN station_name ILIKE :q THEN 80
                WHEN city ILIKE :q THEN 60
                ELSE 40
            END AS score
        FROM stations
        WHERE is_active = TRUE
          AND (station_code ILIKE :q OR station_name ILIKE :q OR city ILIKE :q OR state ILIKE :q)
        ORDER BY score DESC, station_name ASC
        LIMIT 10
    """
    rows = await fetch_all(sql, {"q": q, "code_exact": code_exact})
    results = []
    hub_codes = {"HWH", "NDLS", "SBC", "MAS", "CSMT", "PUNE", "ADI", "CNB"}
    for r in rows:
        st = StationResponse(
            code=r["code"],
            name=r["name"],
            city=r["city"],
            state=r["state"],
            zone=r["zone"],
            platforms=r["platforms"],
            status=r["status"]
        )
        results.append(
            StationSuggestionResponse(
                station=st,
                matchedField=r["matched_field"],
                score=r["score"],
                isHub=r["code"] in hub_codes
            )
        )
    return results


async def create_station(station_in: StationCreate) -> StationResponse:
    sql = """
        INSERT INTO stations (station_code, station_name, city, state, railway_zone, is_active)
        VALUES (UPPER(:code), :name, :city, :state, :zone, TRUE)
        RETURNING 
            station_code AS code,
            station_name AS name,
            city,
            state,
            railway_zone AS zone,
            6 AS platforms,
            'ACTIVE' AS status
    """
    params = {
        "code": station_in.code.strip(),
        "name": station_in.name.strip(),
        "city": station_in.city.strip(),
        "state": station_in.state.strip(),
        "zone": station_in.zone or "NR",
    }
    row = await fetch_one(sql, params)
    return StationResponse(**row)


async def update_station(code: str, station_in: StationUpdate) -> Optional[StationResponse]:
    existing = await get_station_by_code(code)
    if not existing:
        return None
    
    name = station_in.name if station_in.name is not None else existing.name
    city = station_in.city if station_in.city is not None else existing.city
    state = station_in.state if station_in.state is not None else existing.state
    zone = station_in.zone if station_in.zone is not None else existing.zone
    is_active = (station_in.status.upper() == "ACTIVE") if station_in.status is not None else True
    
    sql = """
        UPDATE stations
        SET station_name = :name,
            city = :city,
            state = :state,
            railway_zone = :zone,
            is_active = :is_active,
            updated_at = NOW()
        WHERE UPPER(station_code) = UPPER(:code)
        RETURNING 
            station_code AS code,
            station_name AS name,
            city,
            state,
            railway_zone AS zone,
            6 AS platforms,
            CASE WHEN is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status
    """
    params = {
        "code": code,
        "name": name,
        "city": city,
        "state": state,
        "zone": zone,
        "is_active": is_active,
    }
    row = await fetch_one(sql, params)
    if not row:
        return None
    return StationResponse(**row)


async def delete_station(code: str) -> bool:
    sql = """
        UPDATE stations
        SET is_active = FALSE, updated_at = NOW()
        WHERE UPPER(station_code) = UPPER(:code)
    """
    await execute_commit(sql, {"code": code})
    return True
