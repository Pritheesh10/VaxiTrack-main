from beanie import Document, PydanticObjectId
from typing import Optional
from datetime import datetime

class Vaccine(Document):
    child_id: PydanticObjectId
    vaccine_name: str
    scheduled_date: str
    administered_date: Optional[str] = None
    status: str = "pending"
    notes: Optional[str] = None
    administered_by: Optional[PydanticObjectId] = None
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "vaccines"
