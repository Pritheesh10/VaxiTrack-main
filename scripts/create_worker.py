from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import init_db
from app.models.user import User
from app.utils.hash_utils import hash_password


async def main() -> None:
    await init_db()

    email = "worker@vaxitrack.com"
    existing = await User.find_one(User.email == email)
    if existing:
        print(f"Worker already exists (id={existing.id})")
        return

    worker = User(
        name="Health Worker",
        email=email,
        password_hash=hash_password("worker123"),
        role="worker",
        phone_number="+910000000001",
        is_active=True,
    )
    await worker.insert()
    print(f"Worker created successfully (id={worker.id})")
    print(f"  Email:    {email}")
    print(f"  Password: worker123")


if __name__ == "__main__":
    asyncio.run(main())
