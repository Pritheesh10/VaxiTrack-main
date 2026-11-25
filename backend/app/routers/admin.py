from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr

from app.middleware.rbac_middleware import require_admin
from app.models.user import User
from app.services.admin_service import (
    create_healthcare_worker,
    deactivate_user,
    delete_child_record,
    delete_user,
    generate_full_report,
    get_all_call_logs,
    get_all_children,
    get_all_users,
    get_call_analytics,
    get_child_full_details,
    get_missed_vaccination_report,
    get_monthly_vaccination_trend,
    get_platform_stats,
    get_user_detail,
    get_vaccination_coverage_by_vaccine,
)


router = APIRouter(prefix="/api/admin", tags=["Admin"])


class CreateWorkerPayload(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    password: str


@router.get("/stats")
async def admin_stats(
    _admin: User = Depends(require_admin),
):
    return await get_platform_stats()


@router.get("/users")
async def admin_users(
    role: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    _admin: User = Depends(require_admin),
):
    return await get_all_users(role=role, search=search, page=page, limit=limit)


@router.get("/users/{user_id}")
async def admin_user_detail(
    user_id: str,
    _admin: User = Depends(require_admin),
):
    user = await get_user_detail(user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/users/create-worker", status_code=status.HTTP_201_CREATED)
async def admin_create_worker(
    payload: CreateWorkerPayload,
    _admin: User = Depends(require_admin),
):
    try:
        return await create_healthcare_worker(payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.patch("/users/{user_id}/deactivate")
async def admin_deactivate_user(
    user_id: str,
    _admin: User = Depends(require_admin),
):
    result = await deactivate_user(user_id=user_id)
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return result


@router.delete("/users/{user_id}")
async def admin_delete_user(
    user_id: str,
    admin_user: User = Depends(require_admin),
):
    try:
        deleted = await delete_user(user_id=user_id, acting_user_id=admin_user.id)
    except PermissionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


@router.get("/children")
async def admin_children(
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    _admin: User = Depends(require_admin),
):
    return await get_all_children(search=search, page=page, limit=limit)


@router.get("/children/{child_id}")
async def admin_child_detail(
    child_id: str,
    _admin: User = Depends(require_admin),
):
    payload = await get_child_full_details(child_id=child_id)
    if not payload:
        raise HTTPException(status_code=404, detail="Child not found")
    return payload


@router.delete("/children/{child_id}")
async def admin_delete_child(
    child_id: str,
    _admin: User = Depends(require_admin),
):
    deleted = await delete_child_record(child_id=child_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Child not found")
    return {"message": "Child record deleted"}


@router.get("/vaccines/coverage")
async def admin_vaccine_coverage(
    _admin: User = Depends(require_admin),
):
    return await get_vaccination_coverage_by_vaccine()


@router.get("/vaccines/missed-report")
async def admin_missed_report(
    _admin: User = Depends(require_admin),
):
    return await get_missed_vaccination_report()


@router.get("/vaccines/monthly-trend")
async def admin_monthly_trend(
    _admin: User = Depends(require_admin),
):
    return await get_monthly_vaccination_trend()


@router.get("/calls/logs")
async def admin_call_logs(
    status: str | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    _admin: User = Depends(require_admin),
):
    return await get_all_call_logs(
        status=status,
        date_from=date_from,
        date_to=date_to,
        search=search,
        page=page,
        limit=limit,
    )


@router.get("/calls/analytics")
async def admin_call_analytics(
    _admin: User = Depends(require_admin),
):
    return await get_call_analytics()


@router.get("/reports/export")
async def admin_export_report(
    _admin: User = Depends(require_admin),
):
    return await generate_full_report()
