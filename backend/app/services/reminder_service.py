from __future__ import annotations

from datetime import date, timedelta

from app.models.vaccine import Vaccine


async def get_vaccines_due_tomorrow() -> list[Vaccine]:
    tomorrow = (date.today() + timedelta(days=1)).isoformat()

    vaccines = await Vaccine.find(
        Vaccine.scheduled_date == tomorrow,
        Vaccine.status == "pending",
    ).to_list()

    return vaccines
