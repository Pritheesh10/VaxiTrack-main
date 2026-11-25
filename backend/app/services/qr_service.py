# app/services/qr_service.py

import os

import qrcode


def generate_qr(child_id: str) -> str:
    """Generate a QR code image for a child's vaccination record.

    ``child_id`` is now a string (MongoDB ObjectId hex).
    """
    qr_data = f"http://localhost:3000/records/{child_id}"

    qr = qrcode.make(qr_data)

    folder = "static/qr_codes"
    os.makedirs(folder, exist_ok=True)

    file_path = f"{folder}/child_{child_id}.png"
    qr.save(file_path)

    return file_path
