from __future__ import annotations

import asyncio
import getpass
import sys
from pathlib import Path

# Allow importing backend app modules when running from project root.
ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import init_db  # noqa: E402
from app.models.user import User  # noqa: E402
from app.utils.hash_utils import hash_password  # noqa: E402


async def main() -> None:
    print("Create Vaxi-Track Admin Account")
    name = input("Name: ").strip()
    email = input("Email: ").strip().lower()
    password = getpass.getpass("Password: ").strip()

    if not name or not email or not password:
        print("All fields are required")
        raise SystemExit(1)

    await init_db()

    existing = await User.find_one(User.email == email)
    if existing:
        print("A user with this email already exists")
        raise SystemExit(1)

    admin = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role="admin",
        is_active=True,
    )
    await admin.insert()
    print(f"Admin created successfully  (id={admin.id})")


if __name__ == "__main__":
    asyncio.run(main())
