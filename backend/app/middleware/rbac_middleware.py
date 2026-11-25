"""Role-based access control dependency factories."""

from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.utils.jwt_utils import get_current_user


def require_role(*allowed_roles: str):
    """Return a FastAPI dependency that checks the user has one of the allowed roles."""

    async def _guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}",
            )
        return current_user

    return _guard


require_worker = require_role("worker", "healthcare_worker", "admin")
require_admin = require_role("admin")
require_parent = require_role("parent")
