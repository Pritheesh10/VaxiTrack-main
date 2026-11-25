from __future__ import annotations

from calendar import monthrange
from datetime import date, datetime, timedelta

from beanie import PydanticObjectId

from app.models.child import Child
from app.models.vaccine import Vaccine


OFFICIAL_SCHEDULE = [
    ("BCG", "birth", 0, "At Birth"),
    ("OPV-0", "birth", 0, "At Birth"),
    ("Hepatitis B (Birth dose)", "birth", 0, "At Birth"),
    ("OPV-1", "weeks", 6, "6 Weeks"),
    ("Pentavalent-1", "weeks", 6, "6 Weeks"),
    ("Rotavirus (RVV)-1", "weeks", 6, "6 Weeks"),
    ("fIPV-1", "weeks", 6, "6 Weeks"),
    ("PCV-1", "weeks", 6, "6 Weeks"),
    ("OPV-2", "weeks", 10, "10 Weeks"),
    ("Pentavalent-2", "weeks", 10, "10 Weeks"),
    ("RVV-2", "weeks", 10, "10 Weeks"),
    ("OPV-3", "weeks", 14, "14 Weeks"),
    ("Pentavalent-3", "weeks", 14, "14 Weeks"),
    ("fIPV-2", "weeks", 14, "14 Weeks"),
    ("RVV-3", "weeks", 14, "14 Weeks"),
    ("PCV-2", "weeks", 14, "14 Weeks"),
    ("MR-1", "months", 9, "9-12 Months"),
    ("JE-1", "months", 9, "9-12 Months (specific areas)"),
    ("PCV-Booster", "months", 9, "9-12 Months"),
    ("Vitamin A (1st dose)", "months", 9, "9-12 Months"),
    ("MR-2", "months", 16, "16-24 Months"),
    ("JE-2", "months", 16, "16-24 Months"),
    ("DPT Booster-1", "months", 16, "16-24 Months"),
    ("OPV Booster", "months", 16, "16-24 Months"),
    ("Vitamin A (2nd dose)", "months", 16, "16-24 Months"),
    ("DPT Booster-2", "years", 5, "5-6 Years"),
    ("Td", "years", 10, "10 Years"),
    ("Td", "years", 16, "16 Years"),
]

EXPECTED_VACCINES = {name for name, _unit, _value, _window in OFFICIAL_SCHEDULE}


def _parse_dob(raw_dob: str) -> date:
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y"):
        try:
            return datetime.strptime(raw_dob, fmt).date()
        except ValueError:
            continue
    raise ValueError("Invalid DOB format. Use YYYY-MM-DD (or DD/MM/YYYY).")


def _add_months(base_date: date, months: int) -> date:
    year = base_date.year + (base_date.month - 1 + months) // 12
    month = (base_date.month - 1 + months) % 12 + 1
    day = min(base_date.day, monthrange(year, month)[1])
    return date(year, month, day)


def _add_years(base_date: date, years: int) -> date:
    return _add_months(base_date, years * 12)


async def _sync_overdue_statuses(parent_id: PydanticObjectId | None = None) -> None:
    today = date.today()
    today_str = today.isoformat()

    if parent_id is not None:
        children = await Child.find(Child.parent_id == parent_id).to_list()
        child_ids = [c.id for c in children]
        if not child_ids:
            return
        stale = await Vaccine.find(
            {"child_id": {"$in": child_ids}},
            Vaccine.status == "pending",
            {"scheduled_date": {"$lt": today_str}},
        ).to_list()
    else:
        stale = await Vaccine.find(
            Vaccine.status == "pending",
            {"scheduled_date": {"$lt": today_str}},
        ).to_list()

    for row in stale:
        row.status = "missed"
        await row.save()


async def _upgrade_legacy_schedule_if_safe(parent_id: PydanticObjectId) -> None:
    children = await Child.find(Child.parent_id == parent_id).to_list()

    for child in children:
        records = await Vaccine.find(
            Vaccine.child_id == child.id
        ).sort(+Vaccine.scheduled_date).to_list()

        if not records:
            continue

        names = {rec.vaccine_name for rec in records}
        if names == EXPECTED_VACCINES:
            continue
        if any(rec.status == "completed" or rec.administered_date for rec in records):
            continue

        # Delete old records and regenerate
        await Vaccine.find(Vaccine.child_id == child.id).delete()
        await generate_vaccine_schedule(child.id, child.date_of_birth)


async def generate_vaccine_schedule(child_id: PydanticObjectId, dob: str) -> list[Vaccine]:
    existing = await Vaccine.find(
        Vaccine.child_id == child_id
    ).sort(+Vaccine.scheduled_date).to_list()
    if existing:
        return existing

    dob_date = _parse_dob(dob)
    today = date.today()
    records: list[Vaccine] = []

    for vaccine_name, unit, value, milestone in OFFICIAL_SCHEDULE:
        if unit == "birth":
            scheduled_date = dob_date
        elif unit == "weeks":
            scheduled_date = dob_date + timedelta(weeks=value)
        elif unit == "months":
            scheduled_date = _add_months(dob_date, value)
        else:
            scheduled_date = _add_years(dob_date, value)

        record = Vaccine(
            child_id=child_id,
            vaccine_name=vaccine_name,
            scheduled_date=scheduled_date.isoformat(),
            status="pending" if scheduled_date >= today else "missed",
            notes=f"Govt schedule timeline: {milestone}",
        )
        await record.insert()
        records.append(record)

    return records


async def get_vaccines_by_child(child_id: str) -> list[Vaccine]:
    oid = PydanticObjectId(child_id)
    child = await Child.get(oid)
    if child:
        await _upgrade_legacy_schedule_if_safe(child.parent_id)
        await _sync_overdue_statuses(child.parent_id)

    return await Vaccine.find(
        Vaccine.child_id == oid
    ).sort(+Vaccine.scheduled_date).to_list()


async def get_upcoming_vaccines(parent_id: str) -> list[Vaccine]:
    pid = PydanticObjectId(parent_id)
    await _upgrade_legacy_schedule_if_safe(pid)
    await _sync_overdue_statuses(pid)

    today_str = date.today().isoformat()
    children = await Child.find(Child.parent_id == pid).to_list()
    child_ids = [c.id for c in children]
    if not child_ids:
        return []

    return await Vaccine.find(
        {"child_id": {"$in": child_ids}},
        Vaccine.status == "pending",
        {"scheduled_date": {"$gte": today_str}},
    ).sort(+Vaccine.scheduled_date).to_list()


async def get_missed_vaccines(parent_id: str) -> list[Vaccine]:
    pid = PydanticObjectId(parent_id)
    await _upgrade_legacy_schedule_if_safe(pid)
    await _sync_overdue_statuses(pid)

    children = await Child.find(Child.parent_id == pid).to_list()
    child_ids = [c.id for c in children]
    if not child_ids:
        return []

    return await Vaccine.find(
        {"child_id": {"$in": child_ids}},
        Vaccine.status == "missed",
    ).sort(+Vaccine.scheduled_date).to_list()
