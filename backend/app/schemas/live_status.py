from typing import List, Optional
from pydantic import BaseModel


class StationLiveHalt(BaseModel):
    stationCode: str
    stationName: str
    scheduledArrival: str
    actualArrival: str
    scheduledDeparture: str
    actualDeparture: str
    delayMinutes: int
    platform: str
    distanceKm: float
    status: str  # PASSED, CURRENT, UPCOMING


class LiveTrainStatusResponse(BaseModel):
    trainNumber: str
    trainName: str
    currentStation: str
    nextStation: str
    statusMessage: str
    delayMinutes: int
    currentSpeedKmH: int
    distanceCoveredKm: float
    totalDistanceKm: float
    lastUpdated: str
    halts: List[StationLiveHalt]
