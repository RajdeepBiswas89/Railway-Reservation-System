from typing import List, Optional
from pydantic import BaseModel


class AdminMetricsResponse(BaseModel):
    totalTrains: int
    totalStations: int
    todaysBookings: int
    totalRevenue: float
    availableSeats: int
    cancelledTickets: int
    activePassengers: int
    onTimePerformance: float


class RevenueTrendItem(BaseModel):
    date: str
    revenue: float
    bookings: int


class ClassDistributionItem(BaseModel):
    classCode: str
    count: int
    revenue: float
    occupancyPercent: float


class TopRouteItem(BaseModel):
    route: str
    bookings: int
    revenue: float


class AdminReportResponse(BaseModel):
    dateRange: str
    totalTicketsSold: int
    totalGrossRevenue: float
    cancellationLoss: float
    netRevenue: float
    occupancyRate: float
    punctualityIndex: float
    topRoutes: List[TopRouteItem]
