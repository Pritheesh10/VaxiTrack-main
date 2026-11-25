from __future__ import annotations

from beanie import PydanticObjectId
from fastapi import HTTPException

from app.models.call_log import CallLog
from app.models.child import Child
from app.models.vaccine import Vaccine
from app.schemas.child import ChildCreate
from app.services.qr_service import generate_qr


async def create_child(child_data: ChildCreate, parent_id: str) -> Child:
    dob = child_data.date_of_birth or child_data.dob
    if not dob:
        raise HTTPException(status_code=400, detail="date_of_birth is required")

    child = Child(
        name=child_data.name,
        date_of_birth=dob,
        gender=child_data.gender,
        blood_group=child_data.blood_group,
        parent_id=PydanticObjectId(parent_id),
        qr_code="",
    )
    await child.insert()

    qr_path = generate_qr(str(child.id))
    child.qr_code = qr_path
    await child.save()

    from app.services.vaccine_service import generate_vaccine_schedule
    await generate_vaccine_schedule(child.id, dob)
    return child


async def get_children_by_parent(parent_id: str) -> list[Child]:
    children = await Child.find(
        Child.parent_id == PydanticObjectId(parent_id)
    ).sort(-Child.created_at).to_list()

    # Attach vaccines to each child for the response
    for child in children:
        child.vaccines = await Vaccine.find(Vaccine.child_id == child.id).to_list()
    return children


async def get_child_by_id(child_id: str, parent_id: str) -> Child:
    child = await Child.find_one(
        Child.id == PydanticObjectId(child_id),
        Child.parent_id == PydanticObjectId(parent_id),
    )
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    child.vaccines = await Vaccine.find(Vaccine.child_id == child.id).to_list()
    child.call_logs = await CallLog.find(CallLog.child_id == child.id).to_list()
    return child


async def delete_child(child_id: str, parent_id: str) -> None:
    child = await Child.find_one(
        Child.id == PydanticObjectId(child_id),
        Child.parent_id == PydanticObjectId(parent_id),
    )
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    await Vaccine.find(Vaccine.child_id == child.id).delete()
    await CallLog.find(CallLog.child_id == child.id).delete()
    await child.delete()
