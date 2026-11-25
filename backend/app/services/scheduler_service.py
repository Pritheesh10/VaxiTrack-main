from apscheduler.schedulers.background import BackgroundScheduler
from app.models.vaccine import Vaccine
from app.models.child import Child
from app.models.user import User
from app.services.voice_service import make_reminder_call, make_followup_call
from datetime import date, timedelta
import asyncio

scheduler = BackgroundScheduler()

async def send_reminders():
    tomorrow = str(date.today() + timedelta(days=1))
    vaccines = await Vaccine.find(
        Vaccine.scheduled_date == tomorrow,
        Vaccine.status == "pending"
    ).to_list()
    for vaccine in vaccines:
        child = await Child.get(vaccine.child_id)
        if not child:
            continue
        parent = await User.get(child.parent_id)
        if parent and parent.phone_number:
            make_reminder_call(
                parent_phone=parent.phone_number,
                child_name=child.name,
                vaccine_name=vaccine.vaccine_name,
                scheduled_date=vaccine.scheduled_date
            )

async def send_followups():
    missed = await Vaccine.find(
        Vaccine.status == "missed"
    ).to_list()
    for vaccine in missed:
        child = await Child.get(vaccine.child_id)
        if not child:
            continue
        parent = await User.get(child.parent_id)
        if parent and parent.phone_number:
            make_followup_call(
                parent_phone=parent.phone_number,
                child_name=child.name,
                vaccine_name=vaccine.vaccine_name,
                missed_date=vaccine.scheduled_date
            )

def run_reminders():
    asyncio.run(send_reminders())

def run_followups():
    asyncio.run(send_followups())

def start_scheduler():
    scheduler.add_job(run_reminders, 'cron', hour=9, minute=0)
    scheduler.add_job(run_followups, 'cron', hour=10, minute=0)
    scheduler.start()
