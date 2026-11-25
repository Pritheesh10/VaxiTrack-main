from pydantic import BaseModel
from typing import Optional

class ChildCreate(BaseModel):
    name: str
    date_of_birth: str
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    parent_id: Optional[str] = None
    dob: Optional[str] = None

class ChildResponse(BaseModel):
    id: str
    name: str
    date_of_birth: str
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    qr_code: Optional[str] = None

    class Config:
        from_attributes = True
