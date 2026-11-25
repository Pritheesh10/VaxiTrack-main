from pydantic import BaseModel
from typing import Optional

class VaccineCreate(BaseModel):
    child_id: str
    vaccine_name: str
    scheduled_date: str
    notes: Optional[str] = None

class VaccineResponse(BaseModel):
    id: str
    child_id: str
    vaccine_name: str
    scheduled_date: str
    administered_date: Optional[str] = None
    status: str
    notes: Optional[str] = None

class VaccineStatusUpdate(BaseModel):
    status: str
    administered_date: Optional[str] = None
    scheduled_date: Optional[str] = None
    notes: Optional[str] = None
