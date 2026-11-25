from pydantic import BaseModel
from typing import Optional

class CallLogCreate(BaseModel):
    child_id: str
    parent_phone: str
    status: str
    transcript: Optional[str] = None
    ai_response: Optional[str] = None

class CallLogResponse(BaseModel):
    id: str
    child_id: str
    parent_phone: str
    status: str
    transcript: Optional[str] = None
    ai_response: Optional[str] = None
    called_at: str
