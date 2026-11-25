from beanie import Document, PydanticObjectId
from typing import Optional
from datetime import datetime

class Child(Document):
    name: str
    date_of_birth: str
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    parent_id: PydanticObjectId
    qr_code: Optional[str] = None
    birth_certificate: Optional[str] = None
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "children"
