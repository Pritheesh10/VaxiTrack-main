from __future__ import annotations

import json
import re
from collections import Counter
from datetime import date, datetime, timedelta
from typing import Any

from beanie import PydanticObjectId

from app.models.call_log import CallLog
from app.models.child import Child
from app.models.user import User
from app.models.vaccine import Vaccine
from app.utils.hash_utils import hash_password


def _parse_transcript(raw: str | None) -> str:
    if not raw:
        return ""
    try:
        payload = json.loads(raw)
        if isinstance(payload, dict):
            return str(payload.get("transcript") or "")
    except (json.JSONDecodeError, TypeError):
        pass
    return raw


def _parse_ai_response(raw: str | None, ai_response: str | None) -> str:
    if ai_response:
        return ai_response
    if not raw:
        return ""
    try:
        payload = json.loads(raw)
        if isinstance(payload, dict):
            return str(payload.get("ai_response") or "")
    except (json.JSONDecodeError, TypeError):
        pass
    return ""


def _to_percent(part: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round((part / total) * 100, 2)


async def get_platform_stats() -> dict[str, Any]:
    total_parents = await User.find(User.role == "parent").count()
    total_healthcare_workers = await User.find(User.role.is_in(["worker", "healthcare_worker"])).count()
    total_children = await Child.find_all().count()

    total_vaccines_scheduled = await Vaccine.find_all().count()
    total_vaccines_completed = await Vaccine.find(Vaccine.status == "completed").count()
    total_vaccines_missed = await Vaccine.find(Vaccine.status == "missed").count()
    total_vaccines_pending = await Vaccine.find(Vaccine.status == "pending").count()

    total_calls_made = await CallLog.find_all().count()
    total_calls_confirmed = await CallLog.find(CallLog.status == "confirmed").count()
    total_calls_no_response = await CallLog.find(CallLog.status == "no_response").count()

    return {
        "total_parents": total_parents,
        "total_healthcare_workers": total_healthcare_workers,
        "total_children": total_children,
        "total_vaccines_scheduled": total_vaccines_scheduled,
        "total_vaccines_completed": total_vaccines_completed,
        "total_vaccines_missed": total_vaccines_missed,
        "total_vaccines_pending": total_vaccines_pending,
        "total_calls_made": total_calls_made,
        "total_calls_confirmed": total_calls_confirmed,
        "total_calls_no_response": total_calls_no_response,
        "vaccination_coverage_percent": _to_percent(total_vaccines_completed, total_vaccines_scheduled),
        "call_success_rate_percent": _to_percent(total_calls_confirmed, total_calls_made),
    }


async def get_all_users(
    role: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    filters = []
    normalized = (role or "").strip().lower()
    if normalized:
        if normalized in {"healthcare_worker", "worker"}:
            filters.append(User.role.is_in(["worker", "healthcare_worker"]))
        else:
            filters.append(User.role == normalized)

    if search:
        token = search.strip()
        filters.append(
            {"$or": [
                {"name": {"$regex": token, "$options": "i"}},
                {"email": {"$regex": token, "$options": "i"}},
            ]}
        )

    query = User.find(*filters) if filters else User.find_all()
    total_count = await query.count()
    users = await query.sort(-User.created_at).skip((page - 1) * limit).limit(limit).to_list()

    records = []
    for u in users:
        child_count = await Child.find(Child.parent_id == u.id).count()
        vax_count = await Vaccine.find(Vaccine.administered_by == u.id, Vaccine.status == "completed").count()
        records.append({
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "phone_number": u.phone_number,
            "role": u.role,
            "is_active": bool(u.is_active),
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "child_count": child_count,
            "vaccination_count": vax_count,
        })

    return {"records": records, "total_count": total_count, "page": page, "limit": limit}


async def get_user_detail(user_id: str) -> dict[str, Any] | None:
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        return None

    children = await Child.find(Child.parent_id == user.id).to_list()
    child_ids = [c.id for c in children]
    vaccines_total = 0
    calls_total = 0
    if child_ids:
        vaccines_total = await Vaccine.find({"child_id": {"$in": child_ids}}).count()
        calls_total = await CallLog.find({"child_id": {"$in": child_ids}}).count()

    completed_administered = await Vaccine.find(
        Vaccine.administered_by == user.id, Vaccine.status == "completed"
    ).count()

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "phone_number": user.phone_number,
        "role": user.role,
        "is_active": bool(user.is_active),
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "child_count": len(child_ids),
        "vaccination_count": completed_administered,
        "children_vaccines_total": vaccines_total,
        "children_calls_total": calls_total,
    }


async def get_all_children(
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    if search:
        token = search.strip()
        all_children = await Child.find(
            {"name": {"$regex": token, "$options": "i"}}
        ).sort(-Child.created_at).to_list()
    else:
        all_children = await Child.find_all().sort(-Child.created_at).to_list()

    total_count = len(all_children)
    page_children = all_children[(page - 1) * limit: page * limit]

    records = []
    for child in page_children:
        parent = await User.get(child.parent_id)
        vaccines = await Vaccine.find(Vaccine.child_id == child.id).to_list()
        completed = sum(1 for v in vaccines if v.status == "completed")
        pending = sum(1 for v in vaccines if v.status == "pending")
        missed = sum(1 for v in vaccines if v.status == "missed")
        last_admin = None
        for v in vaccines:
            if v.administered_date and (last_admin is None or v.administered_date > last_admin):
                last_admin = v.administered_date

        records.append({
            "id": str(child.id),
            "name": child.name,
            "date_of_birth": child.date_of_birth,
            "gender": child.gender,
            "blood_group": child.blood_group,
            "parent_id": str(child.parent_id),
            "parent_name": parent.name if parent else "N/A",
            "parent_phone": parent.phone_number if parent else None,
            "qr_code": child.qr_code,
            "created_at": child.created_at.isoformat() if child.created_at else None,
            "total_vaccines": len(vaccines),
            "completed_vaccines": completed,
            "pending_vaccines": pending,
            "missed_vaccines": missed,
            "last_vaccination_date": last_admin,
        })

    return {"records": records, "total_count": total_count, "page": page, "limit": limit}


async def get_child_full_details(child_id: str) -> dict[str, Any] | None:
    child = await Child.get(PydanticObjectId(child_id))
    if not child:
        return None
    parent = await User.get(child.parent_id)
    if not parent:
        return None

    vaccines = await Vaccine.find(Vaccine.child_id == child.id).to_list()
    calls = await CallLog.find(CallLog.child_id == child.id).sort(-CallLog.called_at).to_list()

    return {
        "id": str(child.id),
        "name": child.name,
        "date_of_birth": child.date_of_birth,
        "gender": child.gender,
        "blood_group": child.blood_group,
        "qr_code": child.qr_code,
        "created_at": child.created_at.isoformat() if child.created_at else None,
        "parent": {
            "id": str(parent.id),
            "name": parent.name,
            "phone_number": parent.phone_number,
            "email": parent.email,
        },
        "vaccines": [
            {
                "id": str(v.id),
                "vaccine_name": v.vaccine_name,
                "scheduled_date": v.scheduled_date,
                "administered_date": v.administered_date,
                "status": v.status,
                "notes": v.notes,
                "administered_by": str(v.administered_by) if v.administered_by else None,
            }
            for v in vaccines
        ],
        "call_history": [
            {
                "id": str(c.id),
                "status": c.status,
                "parent_phone": c.parent_phone,
                "transcript": c.transcript or "",
                "ai_response": c.ai_response or "",
                "called_at": c.called_at.isoformat() if c.called_at else None,
            }
            for c in calls
        ],
    }


async def get_all_call_logs(
    status: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    filters: dict[str, Any] = {}
    if status:
        filters["status"] = status
    if date_from:
        filters.setdefault("called_at", {})["$gte"] = datetime.combine(date_from, datetime.min.time())
    if date_to:
        filters.setdefault("called_at", {})["$lte"] = datetime.combine(date_to, datetime.max.time())

    all_logs = await CallLog.find(filters).sort(-CallLog.called_at).to_list()
    total_count = len(all_logs)
    page_logs = all_logs[(page - 1) * limit: page * limit]

    records = []
    for log in page_logs:
        child = await Child.get(log.child_id)
        parent = None
        if child:
            parent = await User.get(child.parent_id)
        records.append({
            "id": str(log.id),
            "child_id": str(log.child_id),
            "child_name": child.name if child else "Unknown",
            "parent_name": parent.name if parent else "Unknown",
            "parent_phone": log.parent_phone,
            "status": log.status,
            "transcript": log.transcript or "",
            "ai_response": log.ai_response or "",
            "called_at": log.called_at.isoformat() if log.called_at else None,
        })

    return {"records": records, "total_count": total_count, "page": page, "limit": limit}


async def get_vaccination_coverage_by_vaccine() -> list[dict[str, Any]]:
    all_vaccines = await Vaccine.find_all().to_list()
    by_name: dict[str, dict] = {}
    for v in all_vaccines:
        if v.vaccine_name not in by_name:
            by_name[v.vaccine_name] = {"total": 0, "completed": 0, "missed": 0, "pending": 0}
        by_name[v.vaccine_name]["total"] += 1
        if v.status == "completed":
            by_name[v.vaccine_name]["completed"] += 1
        elif v.status == "missed":
            by_name[v.vaccine_name]["missed"] += 1
        elif v.status == "pending":
            by_name[v.vaccine_name]["pending"] += 1

    result = []
    for name in sorted(by_name):
        s = by_name[name]
        result.append({
            "vaccine_name": name,
            "total_scheduled": s["total"],
            "total_completed": s["completed"],
            "total_missed": s["missed"],
            "total_pending": s["pending"],
            "coverage_percent": _to_percent(s["completed"], s["total"]),
        })
    return result


async def get_missed_vaccination_report() -> list[dict[str, Any]]:
    today = date.today()
    missed_vaccines = await Vaccine.find(Vaccine.status == "missed").to_list()
    records = []
    for v in missed_vaccines:
        child = await Child.get(v.child_id)
        if not child:
            continue
        parent = await User.get(child.parent_id)
        try:
            sched = datetime.strptime(v.scheduled_date, "%Y-%m-%d").date()
            days_overdue = max(0, (today - sched).days)
        except Exception:
            days_overdue = 0
        records.append({
            "child_id": str(child.id),
            "child_name": child.name,
            "date_of_birth": child.date_of_birth,
            "vaccine_id": str(v.id),
            "vaccine_name": v.vaccine_name,
            "scheduled_date": v.scheduled_date,
            "days_overdue": days_overdue,
            "parent_id": str(child.parent_id),
            "parent_name": parent.name if parent else "N/A",
            "parent_phone": parent.phone_number if parent else None,
            "parent_email": parent.email if parent else None,
        })
    return records


async def get_monthly_vaccination_trend() -> list[dict[str, Any]]:
    today = date.today()
    months = []
    y, m = today.year, today.month
    for _ in range(12):
        months.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    months.reverse()

    all_vaccines = await Vaccine.find_all().to_list()
    by_key: dict[tuple, dict] = {}
    for v in all_vaccines:
        try:
            sched = datetime.strptime(v.scheduled_date, "%Y-%m-%d").date()
            key = (sched.year, sched.month)
            if key not in by_key:
                by_key[key] = {"completed": 0, "missed": 0}
            if v.status == "completed":
                by_key[key]["completed"] += 1
            elif v.status == "missed":
                by_key[key]["missed"] += 1
        except Exception:
            pass

    series = []
    for year, month in months:
        data = by_key.get((year, month), {"completed": 0, "missed": 0})
        series.append({
            "month": datetime(year, month, 1).strftime("%b %Y"),
            "completed": data["completed"],
            "missed": data["missed"],
        })
    return series


async def get_call_analytics() -> dict[str, Any]:
    today = date.today()
    window_start = today - timedelta(days=29)

    all_logs = await CallLog.find_all().to_list()

    calls_by_day: dict[str, int] = {}
    intent_dist = {"confirmed": 0, "reschedule": 0, "no_response": 0, "unclear": 0}
    reason_counter: Counter[str] = Counter()
    stop_words = {
        "the", "and", "for", "with", "this", "that", "will", "have", "from", "your",
        "child", "vaccine", "scheduled", "today", "tomorrow", "please", "able", "attend",
        "yes", "no", "not", "can", "are", "was", "were", "on", "to",
    }

    for log in all_logs:
        if log.called_at:
            day_key = log.called_at.date().isoformat()
            if log.called_at.date() >= window_start:
                calls_by_day[day_key] = calls_by_day.get(day_key, 0) + 1

        s = (log.status or "").lower()
        if s == "confirmed":
            intent_dist["confirmed"] += 1
        elif s == "reschedule_requested":
            intent_dist["reschedule"] += 1
        elif s == "no_response":
            intent_dist["no_response"] += 1
        elif s in ("unclear", "question_asked"):
            intent_dist["unclear"] += 1

        if s in ("no_response", "reschedule_requested", "question_asked"):
            transcript = (log.transcript or "").lower()
            words = re.findall(r"[a-zA-Z]{4,}", transcript)
            for word in words:
                if word not in stop_words:
                    reason_counter[word] += 1

    calls_per_day = []
    for idx in range(30):
        d = window_start + timedelta(days=idx)
        calls_per_day.append({"date": d.isoformat(), "calls": calls_by_day.get(d.isoformat(), 0)})

    reasons = [{"reason": k, "count": v} for k, v in reason_counter.most_common(8)]

    return {
        "calls_per_day": calls_per_day,
        "intent_distribution": intent_dist,
        "most_common_missed_vaccine_reasons": reasons,
    }


async def create_healthcare_worker(worker_data: dict[str, Any]) -> dict[str, Any]:
    existing = await User.find_one(User.email == worker_data["email"])
    if existing:
        raise ValueError("Email already registered")

    worker = User(
        name=worker_data["name"],
        email=worker_data["email"],
        phone_number=worker_data.get("phone_number"),
        password_hash=hash_password(worker_data["password"]),
        role="healthcare_worker",
        is_active=True,
    )
    await worker.insert()
    return {
        "id": str(worker.id),
        "name": worker.name,
        "email": worker.email,
        "phone_number": worker.phone_number,
        "role": worker.role,
        "is_active": bool(worker.is_active),
        "created_at": worker.created_at.isoformat() if worker.created_at else None,
    }


async def deactivate_user(user_id: str) -> dict[str, Any] | None:
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        return None
    user.is_active = False
    await user.save()
    return {"id": str(user.id), "is_active": False}


async def delete_child_record(child_id: str) -> bool:
    child = await Child.get(PydanticObjectId(child_id))
    if not child:
        return False
    await Vaccine.find(Vaccine.child_id == child.id).delete()
    await CallLog.find(CallLog.child_id == child.id).delete()
    await child.delete()
    return True


async def delete_user(user_id: str, acting_user_id) -> bool:
    if str(user_id) == str(acting_user_id):
        raise PermissionError("Admin cannot delete their own account")

    user = await User.get(PydanticObjectId(user_id))
    if not user:
        return False

    if user.role == "parent":
        children = await Child.find(Child.parent_id == user.id).to_list()
        for child in children:
            await Vaccine.find(Vaccine.child_id == child.id).delete()
            await CallLog.find(CallLog.child_id == child.id).delete()
            await child.delete()

    await user.delete()
    return True


async def generate_full_report() -> dict[str, Any]:
    users = await get_all_users(page=1, limit=100000)
    children = await get_all_children(page=1, limit=100000)
    calls = await get_all_call_logs(page=1, limit=100000)

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "stats": await get_platform_stats(),
        "users": users["records"],
        "children": children["records"],
        "vaccines_coverage": await get_vaccination_coverage_by_vaccine(),
        "missed_vaccinations": await get_missed_vaccination_report(),
        "monthly_vaccination_trend": await get_monthly_vaccination_trend(),
        "call_analytics": await get_call_analytics(),
        "call_logs": calls["records"],
    }
