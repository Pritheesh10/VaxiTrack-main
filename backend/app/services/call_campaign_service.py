from __future__ import annotations

import asyncio
import threading
import time
from datetime import date, datetime, timedelta
from uuid import uuid4

from app.config import settings
from app.models.call_log import CallLog
from app.models.child import Child
from app.models.user import User
from app.models.vaccine import Vaccine
from app.services.voice_service import simulate_conversational_call


_state_lock = threading.Lock()
_active_campaign: dict | None = None
_campaign_history: list[dict] = []


def _serialize_campaign(campaign: dict | None) -> dict | None:
    if not campaign:
        return None
    return {
        "campaign_id": campaign["campaign_id"],
        "status": campaign["status"],
        "started_at": campaign["started_at"],
        "ended_at": campaign.get("ended_at"),
        "total_numbers": campaign["total_numbers"],
        "completed_numbers": campaign["completed_numbers"],
        "current_index": campaign["current_index"],
        "items": campaign["items"],
    }


def get_active_campaign_status() -> dict | None:
    with _state_lock:
        return _serialize_campaign(_active_campaign)


def get_campaign_history() -> list[dict]:
    with _state_lock:
        return [
            {
                "campaign_id": item["campaign_id"],
                "status": item["status"],
                "started_at": item["started_at"],
                "ended_at": item.get("ended_at"),
                "total_numbers": item["total_numbers"],
                "completed_numbers": item["completed_numbers"],
            }
            for item in _campaign_history
        ]


async def _build_queue() -> list[dict]:
    today = date.today()
    cutoff = today + timedelta(days=3)
    today_str = today.isoformat()
    cutoff_str = cutoff.isoformat()

    pending = await Vaccine.find(
        Vaccine.status == "pending",
        {"scheduled_date": {"$gte": today_str}},
        {"scheduled_date": {"$lte": cutoff_str}},
    ).sort(+Vaccine.scheduled_date).to_list()

    queue = []
    for vaccine in pending:
        child = await Child.get(vaccine.child_id)
        if not child:
            continue
        parent = await User.get(child.parent_id)
        phone = getattr(parent, "phone_number", None) if parent else None
        phone = phone or settings.DEFAULT_PARENT_PHONE
        queue.append({
            "child_id": str(child.id),
            "child_name": child.name,
            "vaccine_name": vaccine.vaccine_name,
            "scheduled_date": vaccine.scheduled_date,
            "phone_number": phone,
            "status": "queued",
            "transcript": None,
            "intent": None,
            "ai_reply": None,
        })

    return queue


async def _run_campaign_async(campaign_id: str) -> None:
    global _active_campaign

    with _state_lock:
        campaign = _active_campaign
        if not campaign or campaign["campaign_id"] != campaign_id:
            return

    for idx, item in enumerate(campaign["items"]):
        with _state_lock:
            if not _active_campaign or _active_campaign["campaign_id"] != campaign_id:
                return
            _active_campaign["current_index"] = idx
            _active_campaign["items"][idx]["status"] = "dialing"

        await asyncio.sleep(1)

        with _state_lock:
            _active_campaign["items"][idx]["status"] = "talking"

        await asyncio.sleep(1)

        call_result = simulate_conversational_call(
            child_name=item["child_name"],
            vaccine_name=item["vaccine_name"],
            phone_number=item["phone_number"],
            response_seed=idx,
        )

        with _state_lock:
            _active_campaign["items"][idx]["transcript"] = call_result["transcript"]
            _active_campaign["items"][idx]["intent"] = call_result["intent"]
            _active_campaign["items"][idx]["ai_reply"] = call_result["ai_reply"]
            _active_campaign["items"][idx]["status"] = "completed"
            _active_campaign["completed_numbers"] += 1

        from beanie import PydanticObjectId
        entry = CallLog(
            child_id=PydanticObjectId(item["child_id"]),
            parent_phone=item["phone_number"],
            status=call_result["intent"],
            transcript=call_result["transcript"],
            ai_response=call_result["ai_reply"],
        )
        await entry.insert()

    with _state_lock:
        if _active_campaign and _active_campaign["campaign_id"] == campaign_id:
            _active_campaign["status"] = "completed"
            _active_campaign["ended_at"] = datetime.utcnow().isoformat()
            _campaign_history.insert(0, _active_campaign.copy())
            del _campaign_history[10:]
            _active_campaign = None


def _run_campaign(campaign_id: str) -> None:
    """Thread target that creates a new event loop and runs the async campaign."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_run_campaign_async(campaign_id))
    finally:
        loop.close()


async def start_campaign(actor_role: str) -> dict:
    if actor_role.lower() != "worker":
        raise PermissionError("Only healthcare workers can start call campaigns")

    queue = await _build_queue()
    if not queue:
        raise ValueError("No pending vaccination records found to call")

    with _state_lock:
        global _active_campaign
        if _active_campaign and _active_campaign["status"] in {"running", "starting"}:
            raise RuntimeError("A campaign is already running. Wait for completion before starting another.")

        campaign_id = str(uuid4())
        _active_campaign = {
            "campaign_id": campaign_id,
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
            "total_numbers": len(queue),
            "completed_numbers": 0,
            "current_index": None,
            "items": queue,
        }

    worker = threading.Thread(target=_run_campaign, args=(campaign_id,), daemon=True)
    worker.start()

    return {
        "campaign_id": campaign_id,
        "status": "running",
        "total_numbers": len(queue),
        "message": "Campaign started",
    }
