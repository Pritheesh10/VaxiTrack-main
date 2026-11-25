from __future__ import annotations


def transcribe_parent_response(speech_result: str | None = None, digits: str | None = None) -> str:
    """Return a normalized transcript from Twilio speech or DTMF input.

    Twilio may send either SpeechResult (for voice) or Digits (for keypad input).
    """
    if speech_result and speech_result.strip():
        return speech_result.strip()

    # Simple DTMF mapping fallback
    if digits:
        if digits == "1":
            return "Yes, I confirm the appointment"
        if digits == "2":
            return "I need to reschedule"
        if digits == "3":
            return "I have a question"

    return ""


def analyze_parent_response(transcript: str) -> dict:
    """Rule-based fallback analysis used when LLM is unavailable."""
    text = (transcript or "").strip().lower()

    if any(word in text for word in ["yes", "confirm", "will come", "okay", "ok", "attend"]):
        intent = "CONFIRM"
        reply = "Thank you. Your vaccination appointment is confirmed."
    elif any(word in text for word in ["reschedule", "not possible", "can't", "cannot", "busy", "travel", "later"]):
        intent = "RESCHEDULE"
        reply = "Understood. Please share your preferred date and our healthcare worker will assist with rescheduling."
    elif any(word in text for word in ["fever", "sick", "ill", "side effect", "safe", "question", "why", "what"]):
        intent = "QUESTION"
        reply = "Vaccines are generally safe and important for protection. Could you still confirm if you can attend on the scheduled date?"
    else:
        intent = "UNCLEAR"
        reply = "I could not clearly understand. Could you please repeat your response?"

    return {
        "intent": intent,
        "reply": reply,
    }
