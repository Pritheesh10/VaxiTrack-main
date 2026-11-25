from urllib.parse import quote_plus, urlparse, urlunparse

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings
from app.models.user import User
from app.models.child import Child
from app.models.vaccine import Vaccine
from app.models.call_log import CallLog


def _safe_mongo_uri(raw_uri: str) -> str:
    """Re-encode username/password so special chars don't break pymongo."""
    parsed = urlparse(raw_uri)
    if parsed.username or parsed.password:
        user = quote_plus(parsed.username or "")
        pwd = quote_plus(parsed.password or "")
        # Rebuild netloc: user:pwd@host(:port)
        host_part = parsed.hostname or ""
        if parsed.port:
            host_part += f":{parsed.port}"
        netloc = f"{user}:{pwd}@{host_part}"
        return urlunparse(parsed._replace(netloc=netloc))
    return raw_uri


async def init_db():
    client = AsyncIOMotorClient(_safe_mongo_uri(settings.MONGODB_URL))
    await init_beanie(
        database=client[settings.DB_NAME],
        document_models=[User, Child, Vaccine, CallLog]
    )
