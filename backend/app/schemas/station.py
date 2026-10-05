from typing import Optional
from pydantic import BaseModel


class StationBase(BaseModel):
    code: str
    name: str
    city: str
    state: str
    zone: Optional[str] = None
    platforms: Optional[int] = 6
    status: Optional[str] = "ACTIVE"


class StationResponse(StationBase):
    pass


class StationCreate(StationBase):
    pass


class StationUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zone: Optional[str] = None
    platforms: Optional[int] = None
    status: Optional[str] = None


class StationSuggestionResponse(BaseModel):
    station: StationResponse
    matchedField: str
    score: int
    isHub: Optional[bool] = False
