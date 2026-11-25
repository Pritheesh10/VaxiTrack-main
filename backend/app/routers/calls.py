import json
from datetime import datetime, timedelta
from urllib.parse import urlencode
from uuid import uuid4

from fastapi import APIRouter, Depends, Form, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from twilio.twiml.voice_response import VoiceResponse
from beanie import PydanticObjectId

from app.config import settings
from app.models.call_log import CallLog
from app.models.child import Child
from app.models.user import User
from app.models.vaccine import Vaccine
from app.services.call_campaign_service import (
    get_active_campaign_status,
    get_campaign_history,
    start_campaign,
)
from app.services.gemini_service import classify_intent_and_reply
from app.services.stt_service import transcribe_parent_response
from app.services.tts_service import build_opening_message, build_voice_reply
from app.services.voice_service import initiate_outbound_call, start_outbound_campaign
from app.utils.jwt_utils import get_current_user
from app.middleware.rbac_middleware import require_worker

router = APIRouter(prefix="/api/calls", tags=["Calls"])


def _status_from_intent(intent: str) -> str:
    mapping = {
        "CONFIRM": "confirmed",
        "RESCHEDULE": "reschedule_requested",
        "QUESTION": "question_asked",
        "UNCLEAR": "no_response",
    }
    return mapping.get(intent.upper(), "no_response")


def _action_url(
    child_id: str,
    child_name: str,
    vaccine_name: str,
    scheduled_date: str,
    parent_phone: str,
    attempt: int,
) -> str:
    query = urlencode(
        {
            "child_id": child_id,
            "child_name": child_name,
            "vaccine_name": vaccine_name,
            "scheduled_date": scheduled_date,
            "parent_phone": parent_phone,
            "attempt": attempt,
        }
    )
    if settings.NGROK_URL:
        return f"{settings.NGROK_URL.rstrip('/')}/api/calls/handle-response?{query}"
    return f"/api/calls/handle-response?{query}"


async def _save_call_log(
    child_id,
    parent_phone: str,
    status: str,
    transcript: str | None,
    ai_response: str | None,
    vaccine_name: str,
) -> CallLog:
    entry = CallLog(
        child_id=PydanticObjectId(child_id) if isinstance(child_id, str) else child_id,
        parent_phone=parent_phone,
        status=status,
        transcript=transcript,
        ai_response=ai_response,
    )
    await entry.insert()
    return entry


class CampaignStartPayload(BaseModel):
    actor_role: str = "worker"


class TranscriptPayload(BaseModel):
    transcript: str


@router.post("/start-campaign")
async def start_campaign_v3(
    _current_user: User = Depends(require_worker),
):
    try:
        await start_campaign("worker")
    except Exception:
        pass
    result = await start_outbound_campaign(days_ahead=3)
    return {
        "campaign_id": result["campaign_id"],
        "status": "running",
        "total_numbers": result["queued_calls"],
        "message": "Campaign started",
        "records": result["records"],
    }


@router.post("/campaign/start")
async def start_call_campaign(
    payload: CampaignStartPayload,
    _current_user: User = Depends(require_worker),
):
    if payload.actor_role.lower() not in {"worker", "admin"}:
        raise HTTPException(status_code=403, detail="Only worker/admin can start campaigns")
    if payload.actor_role.lower() == "worker":
        try:
            await start_campaign("worker")
        except Exception:
            pass
    result = await start_outbound_campaign(days_ahead=3)
    return {
        "campaign_id": result["campaign_id"],
        "status": "running",
        "total_numbers": result["queued_calls"],
        "message": "Campaign started",
    }


@router.get("/campaign/status")
async def get_call_campaign_status(
    _current_user: User = Depends(get_current_user),
):
    active = get_active_campaign_status()
    return {"active": bool(active), "campaign": active}


@router.get("/campaign/history")
async def get_call_campaign_history(
    _current_user: User = Depends(get_current_user),
):
    return {"history": get_campaign_history()}


@router.get("/logs")
async def get_call_logs(
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "parent":
        children = await Child.find(Child.parent_id == current_user.id).to_list()
        child_ids = [c.id for c in children]
        logs = await CallLog.find({"child_id": {"$in": child_ids}}).sort(-CallLog.called_at).limit(50).to_list()
    else:
        logs = await CallLog.find_all().sort(-CallLog.called_at).limit(50).to_list()

    records = []
    for log in logs:
        child = await Child.get(log.child_id)
        status_map = {
            "confirmed": "answered",
            "reschedule_requested": "answered",
            "question_asked": "answered",
            "no_response": "missed",
            "declined": "missed",
        }
        mapped_status = status_map.get(log.status, "busy")
        records.append({
            "id": str(log.id),
            "child_name": child.name if child else f"Child #{log.child_id}",
            "parent_name": child.name if child else f"Child #{log.child_id}",
            "vaccine_name": "N/A",
            "call_status": mapped_status,
            "status": log.status,
            "transcript": log.transcript,
            "ai_response": log.ai_response,
            "parent_phone": log.parent_phone,
            "timestamp": log.called_at.isoformat() if log.called_at else "",
        })
    return records


@router.post("/conversation/analyze")
async def analyze_conversation(
    payload: TranscriptPayload,
    _current_user: User = Depends(require_worker),
):
    return classify_intent_and_reply(payload.transcript)


@router.post("/voice-webhook")
async def voice_webhook(
    child_id: str = Query(...),
    child_name: str = Query(...),
    vaccine_name: str = Query(...),
    scheduled_date: str = Query(...),
    parent_phone: str = Query(...),
    attempt: int = Query(0),
):
    response = VoiceResponse()
    action = _action_url(
        child_id=child_id,
        child_name=child_name,
        vaccine_name=vaccine_name,
        scheduled_date=scheduled_date,
        parent_phone=parent_phone,
        attempt=attempt,
    )
    gather = response.gather(
        input="speech dtmf",
        num_digits=1,
        speech_timeout="auto",
        language="en-IN",
        action=action,
        method="POST",
    )
    gather.say(build_opening_message(child_name, vaccine_name, scheduled_date), voice="alice")
    response.say("We did not receive a clear response. We will follow up shortly.", voice="alice")
    return Response(content=str(response), media_type="application/xml")


@router.post("/handle-response")
async def handle_response(
    child_id: str = Query(...),
    child_name: str = Query(...),
    vaccine_name: str = Query(...),
    scheduled_date: str = Query(...),
    parent_phone: str = Query(...),
    attempt: int = Query(0),
    speech_result: str = Form(default="", alias="SpeechResult"),
    digits: str = Form(default="", alias="Digits"),
):
    transcript = transcribe_parent_response(speech_result=speech_result, digits=digits)
    analysis = classify_intent_and_reply(transcript)
    intent = str(analysis.get("intent", "UNCLEAR")).upper()
    reply = build_voice_reply(str(analysis.get("reply", "Could you please repeat your response?")))

    response = VoiceResponse()

    if intent == "QUESTION":
        await _save_call_log(
            child_id=child_id,
            parent_phone=parent_phone,
            status=_status_from_intent(intent),
            transcript=transcript,
            ai_response=reply,
            vaccine_name=vaccine_name,
        )
        if attempt < 1:
            next_action = _action_url(
                child_id=child_id,
                child_name=child_name,
                vaccine_name=vaccine_name,
                scheduled_date=scheduled_date,
                parent_phone=parent_phone,
                attempt=attempt + 1,
            )
            gather = response.gather(
                input="speech dtmf", num_digits=1, speech_timeout="auto",
                language="en-IN", action=next_action, method="POST",
            )
            gather.say(reply, voice="alice")
            gather.say("Can you confirm if you can attend on the scheduled date?", voice="alice")
            return Response(content=str(response), media_type="application/xml")

    if intent == "UNCLEAR" and attempt < 1:
        next_action = _action_url(
            child_id=child_id, child_name=child_name, vaccine_name=vaccine_name,
            scheduled_date=scheduled_date, parent_phone=parent_phone, attempt=attempt + 1,
        )
        gather = response.gather(
            input="speech dtmf", num_digits=1, speech_timeout="auto",
            language="en-IN", action=next_action, method="POST",
        )
        gather.say("I could not understand clearly. Please say confirm, reschedule, or question.", voice="alice")
        return Response(content=str(response), media_type="application/xml")

    status = _status_from_intent(intent)
    await _save_call_log(
        child_id=child_id,
        parent_phone=parent_phone,
        status=status,
        transcript=transcript,
        ai_response=reply,
        vaccine_name=vaccine_name,
    )

    response.say(reply, voice="alice")
    response.say("Thank you. Goodbye.", voice="alice")
    response.hangup()
    return Response(content=str(response), media_type="application/xml")


@router.post("/twilio/voice")
async def twilio_voice_entry(
    child_id: str = Query("000000000000000000000000"),
    child_name: str = Query("your child"),
    vaccine_name: str = Query("upcoming vaccine"),
    scheduled_date: str = Query("soon"),
    parent_phone: str = Query("+910000000000"),
):
    return await voice_webhook(
        child_id=child_id, child_name=child_name, vaccine_name=vaccine_name,
        scheduled_date=scheduled_date, parent_phone=parent_phone, attempt=0,
    )


@router.post("/twilio/process-speech")
async def twilio_process_speech(
    speech_result: str = Form(default="", alias="SpeechResult"),
    digits: str = Form(default="", alias="Digits"),
):
    return await handle_response(
        child_id="000000000000000000000000",
        child_name="your child",
        vaccine_name="upcoming vaccine",
        scheduled_date="soon",
        parent_phone="+910000000000",
        attempt=0,
        speech_result=speech_result,
        digits=digits,
    )


@router.post("/trigger-followup/{child_id}")
async def trigger_followup_call(
    child_id: str,
    _admin: User = Depends(require_worker),
):
    child = await Child.get(PydanticObjectId(child_id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    vaccine = None
    vaccines = await Vaccine.find(
        Vaccine.child_id == child.id,
        Vaccine.status.is_in(["pending", "missed"])
    ).sort(Vaccine.scheduled_date).to_list()
    if vaccines:
        vaccine = vaccines[0]
    if not vaccine:
        raise HTTPException(status_code=404, detail="No pending/missed vaccine found for child")

    parent = await User.get(child.parent_id)
    parent_phone = (parent.phone_number if parent else None) or settings.DEFAULT_PARENT_PHONE

    call_sid = await initiate_outbound_call(
        child_id=str(child.id),
        child_name=child.name,
        vaccine_name=vaccine.vaccine_name,
        scheduled_date=vaccine.scheduled_date or "soon",
        parent_phone=parent_phone,
    )

    return {
        "message": "Follow-up call triggered",
        "child_id": str(child.id),
        "vaccine_name": vaccine.vaccine_name,
        "parent_phone": parent_phone,
        "call_sid": call_sid,
    }
