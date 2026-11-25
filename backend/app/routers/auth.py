from fastapi import APIRouter, HTTPException, Depends
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.utils.jwt_utils import create_token, get_current_user
from passlib.context import CryptContext

router = APIRouter(prefix="/api/auth", tags=["Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register")
async def register(user: UserCreate):
    existing = await User.find_one(User.email == user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = pwd_context.hash(user.password)
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed,
        role=user.role,
        phone_number=user.phone_number
    )
    await new_user.insert()
    token = create_token({"sub": str(new_user.id), 
                          "email": new_user.email, 
                          "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(new_user.id),
            "name": new_user.name,
            "full_name": new_user.name,
            "email": new_user.email,
            "role": new_user.role
        }
    }

@router.post("/login")
async def login(credentials: UserLogin):
    user = await User.find_one(User.email == credentials.email)
    if not user or not pwd_context.verify(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    
    token = create_token({"sub": str(user.id),
                          "email": user.email,
                          "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "full_name": user.name,
            "email": user.email,
            "role": user.role,
            "phone_number": user.phone_number
        }
    }

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "full_name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "phone_number": current_user.phone_number
    }
