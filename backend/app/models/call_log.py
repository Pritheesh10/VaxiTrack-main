from beanie import Document, PydanticObjectId
from typing import Optional
from datetime import datetime

class CallLog(Document):
    child_id: PydanticObjectId
    parent_phone: str
    status: str
    transcript: Optional[str] = None
    ai_response: Optional[str] = None
    call_type: Optional[str] = None
    called_at: datetime = datetime.utcnow()

    class Settings:
        name = "call_logs"
