from beanie import Document
from typing import Optional
from datetime import datetime

class User(Document):
    name: str
    email: str
    password_hash: str
    role: str
    phone_number: Optional[str] = None
    is_active: bool = True
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "users"
