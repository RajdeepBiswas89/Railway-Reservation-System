from typing import List, Optional
from pydantic import BaseModel
from app.schemas.train import StationBrief


class PassengerInput(BaseModel):
    id: Optional[str] = None
    fullName: str
    age: int
    gender: str
    nationality: Optional[str] = "Indian"
    idType: Optional[str] = "AADHAAR"
    idNumber: Optional[str] = "DEMO-1234"
    seatPreference: Optional[str] = "NO_PREF"
    mealPreference: Optional[str] = "NO_MEAL"
    allocatedCoach: Optional[str] = None
    allocatedSeat: Optional[str] = None
    allocatedBerth: Optional[str] = None


class PassengerResponse(PassengerInput):
    id: str


class FareBreakdown(BaseModel):
    baseFare: float
    reservationFee: float
    superfastCharge: float
    gst: float
    cateringCharge: float
    total: float


class PaymentDetails(BaseModel):
    method: str
    transactionId: str
    timestamp: str
    status: str
    upiId: Optional[str] = None
    cardLast4: Optional[str] = None


class TrainBrief(BaseModel):
    id: str
    number: str
    name: str
    type: str
    fromStation: Optional[StationBrief] = None
    toStation: Optional[StationBrief] = None


class BookingCreateRequest(BaseModel):
    userId: Optional[str] = None
    userName: str
    userEmail: str
    train: TrainBrief
    journeyDate: str
    classCode: str
    coachNumber: str
    passengers: List[PassengerInput]
    fareBreakdown: FareBreakdown
    payment: PaymentDetails


class BookingResponse(BaseModel):
    id: str
    pnr: str
    userId: str
    userEmail: str
    userName: str
    train: TrainBrief
    fromStation: StationBrief
    toStation: StationBrief
    journeyDate: str
    departureTime: str
    arrivalTime: str
    duration: str
    classCode: str
    coachNumber: str
    passengers: List[PassengerResponse]
    fareBreakdown: FareBreakdown
    payment: PaymentDetails
    status: str  # CONFIRMED, WAITLISTED, CANCELLED, COMPLETED
    bookingDate: str
    platform: Optional[str] = "02"


class BookingCancelRequest(BaseModel):
    reason: Optional[str] = "User requested cancellation"
