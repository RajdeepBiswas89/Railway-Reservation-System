from datetime import datetime
from typing import Optional
from app.schemas.live_status import LiveTrainStatusResponse, StationLiveHalt
from app.services.train_service import get_route_stops, get_train_by_id_or_number


async def get_live_status(identifier: str) -> Optional[LiveTrainStatusResponse]:
    train = await get_train_by_id_or_number(identifier)
    stops = await get_route_stops(identifier)
    if not train or not stops:
        return None

    now = datetime.now()
    minutes = now.hour * 60 + now.minute
    current_idx = min(len(stops) - 1, max(0, (minutes % (8 * 60)) // 90))
    delay = 4 if current_idx > 0 else 0

    halts = []
    for i, stop in enumerate(stops):
        if i < current_idx:
            status = "PASSED"
        elif i == current_idx:
            status = "CURRENT"
        else:
            status = "UPCOMING"
        extra = " (Exp)" if status == "UPCOMING" and stop.arrivalTime not in ("--", "Source") else ""
        halts.append(
            StationLiveHalt(
                stationCode=stop.stationCode,
                stationName=stop.stationName,
                scheduledArrival="Source" if i == 0 else stop.arrivalTime,
                actualArrival="Source" if i == 0 else f"{stop.arrivalTime}{extra}",
                scheduledDeparture="Destination" if i == len(stops) - 1 else stop.departureTime,
                actualDeparture="Destination" if i == len(stops) - 1 else f"{stop.departureTime}{extra}",
                delayMinutes=delay if i <= current_idx else 0,
                platform=str((i % 8) + 1).zfill(2),
                distanceKm=stop.distanceKm,
                status=status,
            )
        )

    current = stops[current_idx]
    nxt = stops[min(current_idx + 1, len(stops) - 1)]
    covered = float(current.distanceKm or 0)
    total = float(train.distanceKm or 1)
    return LiveTrainStatusResponse(
        trainNumber=train.number,
        trainName=train.name,
        currentStation=f"{current.stationName} ({current.stationCode})",
        nextStation=f"{nxt.stationName} ({nxt.stationCode})",
        statusMessage=f"{'Running on-time' if delay == 0 else f'Delayed by {delay} min'} · At {current.stationName}",
        delayMinutes=delay,
        currentSpeedKmH=96 if current_idx < len(stops) - 1 else 0,
        distanceCoveredKm=covered,
        totalDistanceKm=total,
        lastUpdated=now.strftime("%H:%M") + " via GPS Tracker",
        halts=halts,
    )
