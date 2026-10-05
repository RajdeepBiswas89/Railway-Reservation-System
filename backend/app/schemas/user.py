from typing import List, Optional
from pydantic import BaseModel, EmailStr


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRegisterRequest(BaseModel):
    fullName: str
    email: EmailStr
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserProfileResponse"


class SavedPassengerBase(BaseModel):
    fullName: str
    age: int
    gender: str  # MALE, FEMALE, OTHER
    idType: str  # AADHAAR, PASSPORT, PAN, VOTER_ID, DRIVING_LICENSE
    idNumber: str
    preference: Optional[str] = "Lower Berth"


class SavedPassengerResponse(SavedPassengerBase):
    id: str


class UserMetrics(BaseModel):
    totalJourneys: int = 0
    citiesVisited: int = 0
    completedTrips: int = 0
    upcomingTrips: int = 0
    savedKms: int = 0


class UserPreferences(BaseModel):
    preferredClass: str = "3A"
    preferredBerth: str = "LOWER"
    foodChoice: str = "VEG"
    smsAlerts: bool = True
    emailAlerts: bool = True


class UserProfileResponse(BaseModel):
    id: str
    fullName: str
    email: str
    phone: Optional[str] = None
    avatarUrl: Optional[str] = None
    role: str = "USER"
    savedPassengers: List[SavedPassengerResponse] = []
    preferences: Optional[UserPreferences] = UserPreferences()
    metrics: Optional[UserMetrics] = UserMetrics()


class UserUpdateRequest(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None
    preferences: Optional[UserPreferences] = None


class AdminUserItem(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    trips: int = 0
    status: str = "VERIFIED"


TokenResponse.model_rebuild()
