from typing import List, Optional
from pydantic import BaseModel


class PnrPassengerItem(BaseModel):
    number: int
    bookingStatus: str
    currentStatus: str
    coach: str
    berth: str
    berthType: str


class PnrDetailedStatusResponse(BaseModel):
    pnr: str
    trainNumber: str
    trainName: str
    journeyDate: str
    fromStation: str
    toStation: str
    boardingPoint: str
    reservedUpto: str
    classCode: str
    chartStatus: str  # CHART_PREPARED, CHART_NOT_PREPARED
    confirmationProbability: Optional[int] = 100
    coachPositionFromEngine: List[str]
    targetCoach: str
    passengers: List[PnrPassengerItem]
