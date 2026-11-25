from __future__ import annotations

import csv
import io
from datetime import date

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.middleware.rbac_middleware import require_admin
from app.models.call_log import CallLog
from app.models.child import Child
from app.models.user import User
from app.models.vaccine import Vaccine
from app.utils.jwt_utils import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard_stats(
    _current_user: User = Depends(get_current_user),
):
    total_children = await Child.find_all().count()
    completed_vaccines = await Vaccine.find(Vaccine.status == "completed").count()
    pending_vaccines = await Vaccine.find(Vaccine.status == "pending").count()
    total_calls = await CallLog.find_all().count()

    return {
        "total_children": total_children,
        "completed_vaccines": completed_vaccines,
        "pending_vaccines": pending_vaccines,
        "total_reminder_calls": total_calls,
    }


@router.get("/coverage")
async def get_coverage(
    _current_user: User = Depends(get_current_user),
):
    rows = await Vaccine.find(
        Vaccine.scheduled_date != None  # noqa: E711
    ).to_list()

    month_order = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]
    by_month: dict[str, dict] = {}

    for row in rows:
        try:
            from datetime import datetime as _dt
            sched = _dt.strptime(row.scheduled_date, "%Y-%m-%d")
            key = sched.strftime("%b")
        except Exception:
            continue

        if key not in by_month:
            by_month[key] = {"month": key, "completed": 0, "pending": 0}

        if row.status == "completed":
            by_month[key]["completed"] += 1
        else:
            by_month[key]["pending"] += 1

    return sorted(
        by_month.values(),
        key=lambda item: month_order.index(item["month"]) if item["month"] in month_order else 0,
    )


@router.get("/reports")
async def export_reports(
    _current_user: User = Depends(require_admin),
):
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["generated_on", date.today().isoformat()])
    writer.writerow([])
    writer.writerow(["metric", "value"])

    total_children = await Child.find_all().count()
    completed_vaccines = await Vaccine.find(Vaccine.status == "completed").count()
    pending_vaccines = await Vaccine.find(Vaccine.status == "pending").count()
    total_calls = await CallLog.find_all().count()

    writer.writerow(["total_children", total_children])
    writer.writerow(["completed_vaccines", completed_vaccines])
    writer.writerow(["pending_vaccines", pending_vaccines])
    writer.writerow(["total_reminder_calls", total_calls])

    writer.writerow([])
    writer.writerow(["child_id", "child_name", "vaccine_name", "scheduled_date", "status"])

    all_vaccines = await Vaccine.find_all().sort(+Vaccine.child_id).to_list()
    for record in all_vaccines:
        child = await Child.get(record.child_id)
        writer.writerow([
            str(record.child_id),
            child.name if child else "Unknown",
            record.vaccine_name,
            record.scheduled_date or "",
            record.status,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vaxi-track-report.csv"},
    )


@router.get("/campaign-success")
async def get_campaign_success(
    _current_user: User = Depends(get_current_user),
):
    """Aggregate call logs by month into answered / missed / busy buckets."""
    logs = await CallLog.find(CallLog.called_at != None).to_list()  # noqa: E711

    month_order = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]
    by_month: dict[str, dict] = {}

    confirm_intents = {"confirm", "reschedule"}
    miss_intents = {"decline"}

    for log in logs:
        key = log.called_at.strftime("%b") if log.called_at else "Jan"
        if key not in by_month:
            by_month[key] = {"month": key, "answered": 0, "missed": 0, "busy": 0}

        intent = (log.status or "").lower()
        if intent in confirm_intents:
            by_month[key]["answered"] += 1
        elif intent in miss_intents:
            by_month[key]["missed"] += 1
        else:
            by_month[key]["busy"] += 1

    return sorted(
        by_month.values(),
        key=lambda x: month_order.index(x["month"]) if x["month"] in month_order else 0,
    )
