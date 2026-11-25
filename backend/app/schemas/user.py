from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional

class UserCreate(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    fullName: Optional[str] = None
    email: EmailStr
    password: str
    phone_number: Optional[str] = None
    role: str = "parent"

    @model_validator(mode="after")
    def _resolve_name(self):
        """Accept 'name', 'full_name', or 'fullName' from the frontend."""
        resolved = self.name or self.full_name or self.fullName
        if not resolved:
            raise ValueError("name is required")
        self.name = resolved
        return self

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone_number: Optional[str] = None
