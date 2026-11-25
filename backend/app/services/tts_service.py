from __future__ import annotations


def _truncate_for_voice(text: str, max_words: int = 60) -> str:
	words = (text or "").strip().split()
	if len(words) <= max_words:
		return " ".join(words)
	return " ".join(words[:max_words]) + "."


def build_opening_message(child_name: str, vaccine_name: str, scheduled_date: str) -> str:
	raw = (
		f"Hello, this is Vaxi-Track Health Assistant. "
		f"Your child {child_name}'s {vaccine_name} vaccination is scheduled for {scheduled_date}. "
		"Will you be able to attend?"
	)
	return _truncate_for_voice(raw)


def build_voice_reply(reply: str) -> str:
	"""Keep spoken response short so it stays below ~30s at typical speaking speed."""
	return _truncate_for_voice(reply, max_words=60)
