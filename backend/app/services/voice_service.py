import json
import os
import warnings
from datetime import date, timedelta
from typing import Optional
from uuid import uuid4

from gtts import gTTS
from twilio.rest import Client

from app.config import settings
from app.models.call_log import CallLog
from app.models.child import Child
from app.models.user import User
from app.models.vaccine import Vaccine

# Try the new package first, fall back to the deprecated one if necessary.
genai = None
client_gemini: Optional[object] = None
model = None
try:
    import google.genai as genai
except Exception:
    try:
        import google.generativeai as genai
        warnings.warn(
            "All support for ``google.generativeai`` has ended. "
            "Please upgrade to ``google.genai``. Continuing with the older package for now.",
            FutureWarning,
        )
    except Exception:
        genai = None

if genai is not None:
    try:
        if hasattr(genai, "Client"):
            client_gemini = genai.Client(api_key=settings.GEMINI_API_KEY)
            model = None
        else:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            client_gemini = None
    except Exception:
        client_gemini = None
        model = None

# Twilio client
client_twilio = Client(
    settings.TWILIO_ACCOUNT_SID,
    settings.TWILIO_AUTH_TOKEN,
)


def generate_message_with_gemini(
    child_name: str,
    vaccine_name: str,
    scheduled_date: str,
    call_type: str,
) -> str:
    if call_type == "reminder":
        prompt = (
            f"Generate a warm, short voice call message (2-3 sentences max) "
            f"for a vaccination reminder.\n"
            f"Child name: {child_name}\nVaccine: {vaccine_name}\nDate: {scheduled_date}\n"
            f'Start with: "Hello! This is Vaxi-Track Health Assistant."\n'
            f"End with a polite reminder to attend.\n"
            f"No special characters. Plain sentences only."
        )
    else:
        prompt = (
            f"Generate a warm, short voice call message (2-3 sentences max) "
            f"for a missed vaccination follow-up.\n"
            f"Child name: {child_name}\nVaccine: {vaccine_name}\nMissed date: {scheduled_date}\n"
            f'Start with: "Hello! This is Vaxi-Track Health Assistant."\n'
            f"Mention they missed and give a gentle follow-up.\n"
            f"No special characters. Plain sentences only."
        )

    try:
        if model is not None and hasattr(model, "generate_content"):
            response = model.generate_content(prompt)
            return getattr(response, "text", str(response))

        if client_gemini is not None and hasattr(client_gemini, "generate"):
            resp = client_gemini.generate(model="gemini-1.5-flash", prompt=prompt)
            candidates = getattr(resp, "candidates", None)
            if candidates:
                candidate = candidates[0]
                return getattr(candidate, "content", getattr(candidate, "text", str(candidate)))
            return str(resp)
    except Exception:
        pass

    return (
        f"Hello! This is Vaxi-Track Health Assistant. This is a reminder for {child_name} "
        f"about their {vaccine_name} scheduled on {scheduled_date}. Please attend the appointment."
    )


def _save_tts_and_get_url(filename: str, text: str) -> str:
    os.makedirs("static/calls", exist_ok=True)
    path = os.path.join("static/calls", filename)
    tts = gTTS(text=text, lang="en", slow=False)
    tts.save(path)
    return f"{settings.BASE_URL}/static/calls/{filename}"


def make_reminder_call(
    parent_phone: str,
    child_name: str,
    vaccine_name: str,
    scheduled_date: str,
):
    message_text = generate_message_with_gemini(child_name, vaccine_name, scheduled_date, "reminder")
    audio_url = _save_tts_and_get_url(f"reminder_{child_name}.mp3", message_text)

    call = client_twilio.calls.create(
        to=parent_phone,
        from_=settings.TWILIO_PHONE_NUMBER,
        twiml=f"<Response><Play>{audio_url}</Play><Hangup/></Response>",
    )
    return {"call_sid": call.sid, "status": "reminder_sent", "message": message_text}


def make_followup_call(
    parent_phone: str,
    child_name: str,
    vaccine_name: str,
    missed_date: str,
):
    message_text = generate_message_with_gemini(child_name, vaccine_name, missed_date, "missed")
    audio_url = _save_tts_and_get_url(f"followup_{child_name}.mp3", message_text)

    call = client_twilio.calls.create(
        to=parent_phone,
        from_=settings.TWILIO_PHONE_NUMBER,
        twiml=f"<Response><Play>{audio_url}</Play><Hangup/></Response>",
    )
    return {"call_sid": call.sid, "status": "followup_sent", "message": message_text}


def simulate_conversational_call(
    child_name: str,
    vaccine_name: str,
    phone_number: str,
    response_seed: int = 0,
):
    """Used by ``call_campaign_service`` to simulate a short conversational call."""
    ai_reply = generate_message_with_gemini(child_name, vaccine_name, "today", "reminder")

    intents = ["confirmed", "reschedule_requested", "no_response", "busy"]
    intent = intents[response_seed % len(intents)]

    parent_reply = (
        "Thank you, we'll be there." if intent == "confirmed" else
        "Can we reschedule?" if intent == "reschedule_requested" else
        "" if intent == "no_response" else
        "I'm busy right now."
    )

    transcript = f"Assistant: {ai_reply}\nParent: {parent_reply}"
    return {"transcript": transcript, "intent": intent, "ai_reply": ai_reply}


# --- Async stubs for outbound call flows (safe/no-op for now) ---

async def initiate_outbound_call(
    child_id,
    child_name: str,
    vaccine_name: str,
    scheduled_date: str,
    parent_phone: str,
    attempt: int = 0,
) -> str:
    """Create a simulated CallLog entry and return a fake call SID.

    This is a safe stub used while the AI/telephony flow is under development.
    """
    payload = {"transcript": None, "ai_response": None, "vaccine_name": vaccine_name}
    entry = CallLog(
        child_id=child_id,
        parent_phone=parent_phone,
        status="queued",
        transcript=json.dumps(payload),
    )
    await entry.insert()

    fake_sid = f"SIMULATED-{uuid4()}"
    return fake_sid


async def start_outbound_campaign(days_ahead: int = 3) -> dict:
    """Return a lightweight campaign report without launching calls."""
    today = date.today()
    cutoff = today + timedelta(days=days_ahead)
    today_str = today.isoformat()
    cutoff_str = cutoff.isoformat()

    pending = await Vaccine.find(
        Vaccine.status == "pending",
        {"scheduled_date": {"$gte": today_str}},
        {"scheduled_date": {"$lte": cutoff_str}},
    ).to_list()

    records = []
    for vaccine in pending:
        child = await Child.get(vaccine.child_id)
        if not child:
            continue
        parent = await User.get(child.parent_id)
        phone = getattr(parent, "phone_number", None) if parent else None
        phone = phone or settings.DEFAULT_PARENT_PHONE
        records.append({
            "child_id": str(child.id),
            "child_name": child.name,
            "vaccine_name": vaccine.vaccine_name,
            "scheduled_date": vaccine.scheduled_date,
            "phone_number": phone,
            "status": "queued",
        })

    return {"campaign_id": str(uuid4()), "queued_calls": len(records), "records": records}
