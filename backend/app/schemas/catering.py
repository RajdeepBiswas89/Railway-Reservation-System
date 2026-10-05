from typing import List
from pydantic import BaseModel


class MealItemResponse(BaseModel):
    id: str
    name: str
    category: str  # VEG, NON_VEG, JAIN, BREAKFAST, BEVERAGE
    description: str
    price: float
    calories: str
    partnerBrand: str
    rating: float
    availableStations: List[str]
