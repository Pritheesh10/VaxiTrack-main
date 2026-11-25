from fastapi import APIRouter, HTTPException, Depends
from app.models.vaccine import Vaccine
from app.schemas.vaccine import VaccineCreate, VaccineStatusUpdate
from app.utils.jwt_utils import get_current_user
from app.models.user import User
from app.models.child import Child
from beanie import PydanticObjectId
from datetime import date

router = APIRouter(prefix="/api/vaccines", tags=["Vaccines"])

@router.post("/")
async def add_vaccine(
    vaccine: VaccineCreate,
    current_user: User = Depends(get_current_user)
):
    new_vaccine = Vaccine(
        child_id=PydanticObjectId(vaccine.child_id),
        vaccine_name=vaccine.vaccine_name,
        scheduled_date=vaccine.scheduled_date,
        notes=vaccine.notes
    )
    await new_vaccine.insert()
    return {
        "message": "Vaccine scheduled successfully",
        "vaccine_id": str(new_vaccine.id)
    }

@router.get("/upcoming")
async def get_upcoming(
    current_user: User = Depends(get_current_user)
):
    children = await Child.find(
        Child.parent_id == current_user.id
    ).to_list()
    child_ids = [child.id for child in children]
    upcoming = []
    for cid in child_ids:
        vaccines = await Vaccine.find(
            Vaccine.child_id == cid,
            Vaccine.status == "pending"
        ).to_list()
        child = await Child.get(cid)
        for v in vaccines:
            upcoming.append({
                "id": str(v.id),
                "child_name": child.name if child else "Unknown",
                "vaccine_name": v.vaccine_name,
                "scheduled_date": v.scheduled_date,
                "status": v.status
            })
    return upcoming

@router.get("/missed")
async def get_missed(
    current_user: User = Depends(get_current_user)
):
    children = await Child.find(
        Child.parent_id == current_user.id
    ).to_list()
    missed = []
    for child in children:
        vaccines = await Vaccine.find(
            Vaccine.child_id == child.id,
            Vaccine.status == "missed"
        ).to_list()
        for v in vaccines:
            missed.append({
                "id": str(v.id),
                "child_name": child.name,
                "vaccine_name": v.vaccine_name,
                "scheduled_date": v.scheduled_date,
                "status": v.status
            })
    return missed

@router.patch("/{vaccine_id}/status")
async def update_status(
    vaccine_id: str,
    update: VaccineStatusUpdate,
    current_user: User = Depends(get_current_user)
):
    vaccine = await Vaccine.get(PydanticObjectId(vaccine_id))
    if not vaccine:
        raise HTTPException(status_code=404, detail="Vaccine not found")
    vaccine.status = update.status
    if update.administered_date:
        vaccine.administered_date = update.administered_date
    if update.scheduled_date:
        vaccine.scheduled_date = update.scheduled_date
    if update.notes:
        vaccine.notes = update.notes
    if current_user.role in ("healthcare_worker", "worker"):
        vaccine.administered_by = current_user.id
    await vaccine.save()
    return {"message": "Vaccine status updated successfully"}

@router.get("/timeline/{child_id}")
async def get_vaccine_timeline(
    child_id: str,
    current_user: User = Depends(get_current_user),
):
    """Return vaccine records formatted for the timeline view."""
    vaccines = await Vaccine.find(
        Vaccine.child_id == PydanticObjectId(child_id)
    ).to_list()
    return [
        {
            "vaccine_name": v.vaccine_name,
            "scheduled_date": v.scheduled_date,
            "status": v.status,
            "completed_date": v.administered_date,
        }
        for v in vaccines
    ]


@router.get("/child/{child_id}")
async def get_child_vaccines(
    child_id: str,
    current_user: User = Depends(get_current_user)
):
    vaccines = await Vaccine.find(
        Vaccine.child_id == PydanticObjectId(child_id)
    ).to_list()
    return [
        {
            "id": str(v.id),
            "vaccine_name": v.vaccine_name,
            "scheduled_date": v.scheduled_date,
            "administered_date": v.administered_date,
            "status": v.status,
            "notes": v.notes
        } for v in vaccines
    ]
