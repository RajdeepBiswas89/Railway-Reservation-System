from typing import Optional
from app.schemas.pnr import PnrDetailedStatusResponse, PnrPassengerItem
from app.services.booking_service import get_booking_by_pnr


async def check_pnr(pnr: str) -> Optional[PnrDetailedStatusResponse]:
    booking = await get_booking_by_pnr(pnr)
    if not booking:
        return None

    coach = booking.coachNumber or "B1"
    passengers = [
        PnrPassengerItem(
            number=idx + 1,
            bookingStatus=f"CNF / {p.allocatedCoach or coach} / {p.allocatedSeat or '-'}",
            currentStatus=f"CNF / {p.allocatedCoach or coach} / {p.allocatedSeat or '-'}",
            coach=p.allocatedCoach or coach,
            berth=str(p.allocatedSeat or "-"),
            berthType=p.allocatedBerth or "LOWER",
        )
        for idx, p in enumerate(booking.passengers)
    ]
    return PnrDetailedStatusResponse(
        pnr=booking.pnr,
        trainNumber=booking.train.number,
        trainName=booking.train.name,
        journeyDate=booking.journeyDate,
        fromStation=f"{booking.fromStation.name} ({booking.fromStation.code})",
        toStation=f"{booking.toStation.name} ({booking.toStation.code})",
        boardingPoint=booking.fromStation.code,
        reservedUpto=booking.toStation.code,
        classCode=booking.classCode,
        chartStatus="CHART_PREPARED",
        confirmationProbability=100 if booking.status == "CONFIRMED" else 72,
        coachPositionFromEngine=["LOCO", "EOG", "GS", "S1", "S2", "S3", "PC", "B1", "B2", "B3", "A1", "H1", "SLR"],
        targetCoach=coach,
        passengers=passengers,
    )
