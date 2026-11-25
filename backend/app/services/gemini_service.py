from __future__ import annotations

import json
from urllib import request
from urllib.error import URLError, HTTPError

from app.config import settings
from app.services.stt_service import analyze_parent_response

_ALLOWED_INTENTS = {"CONFIRM", "RESCHEDULE", "QUESTION", "UNCLEAR"}


def _extract_json(text: str) -> dict | None:
    text = (text or "").strip()
    if not text:
        return None

    # Try direct JSON parse first.
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass

    # Fallback: find first JSON object in the string.
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]
        try:
            data = json.loads(candidate)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            return None

    return None


def _gemini_prompt(transcript: str) -> str:
    return (
        "You are Vaxi-Track Health Assistant. "
        "A parent responded to a vaccine reminder call. "
        "Classify their intent as one of: CONFIRM, RESCHEDULE, QUESTION, UNCLEAR. "
        "Then generate a short, warm, 1-2 sentence voice response. "
        "Return STRICT JSON only in this format: "
        '{"intent":"CONFIRM|RESCHEDULE|QUESTION|UNCLEAR","reply":"..."}. '\
        f"Parent transcript: {transcript}"
    )


def _call_gemini(transcript: str) -> dict | None:
    if not settings.GEMINI_API_KEY:
        return None

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-1.5-flash:generateContent?key="
        f"{settings.GEMINI_API_KEY}"
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": _gemini_prompt(transcript)}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }

    req = request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=12) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except (URLError, HTTPError, TimeoutError, json.JSONDecodeError):
        return None

    candidates = body.get("candidates") or []
    if not candidates:
        return None

    parts = (((candidates[0] or {}).get("content") or {}).get("parts") or [])
    if not parts:
        return None

    raw_text = (parts[0] or {}).get("text", "")
    parsed = _extract_json(raw_text)
    if not parsed:
        return None

    intent = str(parsed.get("intent", "")).upper().strip()
    reply = str(parsed.get("reply", "")).strip()
    if intent not in _ALLOWED_INTENTS or not reply:
        return None

    return {"intent": intent, "reply": reply}


def classify_intent_and_reply(transcript: str) -> dict:
    """Use Gemini when available; fallback to deterministic keyword rules."""
    result = _call_gemini(transcript)
    if result:
        return result

    fallback = analyze_parent_response(transcript)
    return {
        "intent": fallback["intent"],
        "reply": fallback["reply"],
    }
