import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from beanie import PydanticObjectId

from app.models.child import Child
from app.models.vaccine import Vaccine
from app.models.user import User
from app.schemas.child import ChildCreate
from app.services.qr_service import generate_qr
from app.utils.jwt_utils import get_current_user

BIRTH_CERT_DIR = "static/birth_certificates"
os.makedirs(BIRTH_CERT_DIR, exist_ok=True)

router = APIRouter(prefix="/api/children", tags=["Children"])


# ── helpers ──────────────────────────────────────────────────────
async def _child_dict(child, vaccines=None):
    """Serialise a Child document for JSON responses."""
    # Fetch parent info
    parent = await User.get(child.parent_id) if child.parent_id else None
    data = {
        "id": str(child.id),
        "name": child.name,
        "date_of_birth": child.date_of_birth,
        "gender": child.gender,
        "blood_group": child.blood_group,
        "qr_code": child.qr_code,
        "birth_certificate": child.birth_certificate,
        "parent_name": parent.name if parent else None,
        "parent_phone": parent.phone_number if parent else None,
    }
    if vaccines is not None:
        data["vaccines"] = [
            {
                "id": str(v.id),
                "vaccine_name": v.vaccine_name,
                "scheduled_date": v.scheduled_date,
                "administered_date": getattr(v, "administered_date", None),
                "status": v.status,
                "notes": getattr(v, "notes", None),
            }
            for v in vaccines
        ]
    return data


# ── Worker: list ALL children ────────────────────────────────────
@router.get("/all")
async def get_all_children(
    current_user: User = Depends(get_current_user),
):
    """Workers / admins can view every child record."""
    if current_user.role not in ("worker", "admin", "healthcare_worker"):
        raise HTTPException(status_code=403, detail="Not authorised")
    children = await Child.find().to_list()
    result = []
    for child in children:
        parent = await User.get(child.parent_id) if child.parent_id else None
        vaccines = await Vaccine.find(Vaccine.child_id == child.id).to_list()
        completed = sum(1 for v in vaccines if v.status == "completed")
        total = len(vaccines)
        result.append({
            "id": str(child.id),
            "name": child.name,
            "date_of_birth": child.date_of_birth,
            "gender": child.gender,
            "blood_group": child.blood_group,
            "parent_name": parent.name if parent else None,
            "parent_phone": parent.phone_number if parent else None,
            "completed_vaccines": completed,
            "total_vaccines": total,
        })
    return result


# ── CRUD ─────────────────────────────────────────────────────────
@router.post("/")
async def create_child(
    child: ChildCreate,
    current_user: User = Depends(get_current_user),
):
    parent_id = PydanticObjectId(child.parent_id) if child.parent_id else current_user.id
    dob = child.date_of_birth or child.dob
    if not dob:
        raise HTTPException(status_code=400, detail="date_of_birth is required")

    new_child = Child(
        name=child.name,
        date_of_birth=dob,
        gender=child.gender,
        blood_group=child.blood_group,
        parent_id=parent_id,
    )
    await new_child.insert()

    qr_path = generate_qr(str(new_child.id))
    new_child.qr_code = qr_path
    await new_child.save()

    from app.services.vaccine_service import generate_vaccine_schedule
    await generate_vaccine_schedule(new_child.id, dob)

    return {
        "message": "Child registered successfully",
        "child_id": str(new_child.id),
        "id": str(new_child.id),
        "name": new_child.name,
        "date_of_birth": new_child.date_of_birth,
        "gender": new_child.gender,
        "blood_group": new_child.blood_group,
        "qr_code": qr_path,
        "birth_certificate": new_child.birth_certificate,
    }


@router.get("/")
async def get_my_children(
    current_user: User = Depends(get_current_user),
):
    children = await Child.find(Child.parent_id == current_user.id).to_list()
    result = []
    for child in children:
        vaccines = await Vaccine.find(Vaccine.child_id == child.id).to_list()
        result.append(await _child_dict(child, vaccines))
    return result


# ── QR lookup by QR-code string (worker scanner) ────────────────
@router.get("/qr/{qr_code:path}")
async def get_child_by_qr(
    qr_code: str,
    current_user: User = Depends(get_current_user),
):
    child = await Child.find_one(Child.qr_code == qr_code)
    if not child:
        # Also try matching just the child-id portion
        parts = qr_code.rstrip("/").rsplit("/", 1)
        child_id_str = parts[-1] if parts else qr_code
        try:
            child = await Child.get(PydanticObjectId(child_id_str))
        except Exception:
            child = None
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    vaccines = await Vaccine.find(Vaccine.child_id == child.id).to_list()
    return await _child_dict(child, vaccines)


# ── QR image path for a specific child ───────────────────────────
@router.get("/{child_id}/qr")
async def get_child_qr(
    child_id: str,
    current_user: User = Depends(get_current_user),
):
    child = await Child.get(PydanticObjectId(child_id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Regenerate if missing on disk
    if not child.qr_code or not os.path.isfile(child.qr_code):
        qr_path = generate_qr(str(child.id))
        child.qr_code = qr_path
        await child.save()

    return {"child_id": str(child.id), "qr_code": child.qr_code}


# ── Birth-certificate upload ─────────────────────────────────────
@router.post("/{child_id}/birth-certificate")
async def upload_birth_certificate(
    child_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    child = await Child.get(PydanticObjectId(child_id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    allowed = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP or PDF files are allowed")

    ext = file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "png"
    filename = f"{child_id}_{uuid.uuid4().hex[:8]}.{ext}"
    dest = os.path.join(BIRTH_CERT_DIR, filename)

    contents = await file.read()
    with open(dest, "wb") as f:
        f.write(contents)

    child.birth_certificate = f"{BIRTH_CERT_DIR}/{filename}"
    await child.save()

    return {"message": "Birth certificate uploaded", "birth_certificate": child.birth_certificate}


# ── Single child detail ──────────────────────────────────────────
@router.get("/{child_id}")
async def get_child(
    child_id: str,
    current_user: User = Depends(get_current_user),
):
    child = await Child.get(PydanticObjectId(child_id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    vaccines = await Vaccine.find(Vaccine.child_id == child.id).to_list()
    return await _child_dict(child, vaccines)


@router.delete("/{child_id}")
async def delete_child(
    child_id: str,
    current_user: User = Depends(get_current_user),
):
    child = await Child.get(PydanticObjectId(child_id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    await Vaccine.find(Vaccine.child_id == child.id).delete()
    await child.delete()
    return {"message": "Child deleted successfully"}
