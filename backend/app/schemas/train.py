from typing import List, Optional
from pydantic import BaseModel


class StationBrief(BaseModel):
    code: str
    name: str
    city: str


class TrainClassInfo(BaseModel):
    code: str
    name: str
    baseFare: float
    seatsAvailable: int
    status: str = "AVAILABLE"  # AVAILABLE, LIMITED, WAITLIST, NOT_AVAILABLE
    coachPrefix: str = "B"


class Amenity(BaseModel):
    id: str
    label: str
    available: bool


class RouteStopResponse(BaseModel):
    stationCode: str
    stationName: str
    arrivalTime: str
    departureTime: str
    haltMinutes: int
    distanceKm: float
    day: int
    sequence: int


class TrainResponse(BaseModel):
    id: str
    number: str
    name: str
    type: str  # Vande Bharat, Rajdhani, Shatabdi, Duronto, Superfast, Express
    fromStation: StationBrief
    toStation: StationBrief
    departureTime: str
    arrivalTime: str
    duration: str
    distanceKm: float
    operatingDays: List[str]
    classes: List[TrainClassInfo]
    amenities: List[Amenity]
    status: str = "ON_TIME"  # ON_TIME, DELAYED, RESCHEDULED
    delayMinutes: Optional[int] = 0
    pantryAvailable: bool = True


class TrainSearchParams(BaseModel):
    fromStation: Optional[str] = None
    toStation: Optional[str] = None
    journeyDate: Optional[str] = None
    passengersCount: Optional[int] = 1
    classCode: Optional[str] = "ALL"


class TrainCreate(BaseModel):
    number: str
    name: str
    type: str
    fromStationCode: Optional[str] = None
    toStationCode: Optional[str] = None
    fromStation: Optional[StationBrief] = None
    toStation: Optional[StationBrief] = None
    departureTime: str
    arrivalTime: str
    duration: str
    distanceKm: float
    operatingDays: List[str]
    baseFare: Optional[float] = 1200.0
    classes: Optional[List[TrainClassInfo]] = None
    amenities: Optional[List[Amenity]] = None
    status: Optional[str] = None
    pantryAvailable: Optional[bool] = True


class TrainUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    fromStationCode: Optional[str] = None
    toStationCode: Optional[str] = None
    departureTime: Optional[str] = None
    arrivalTime: Optional[str] = None
    duration: Optional[str] = None
    distanceKm: Optional[float] = None
    operatingDays: Optional[List[str]] = None
    status: Optional[str] = None
    delayMinutes: Optional[int] = None
