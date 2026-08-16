import datetime
import time
from sqlalchemy.orm import Session
from app.models import Document, ProcessingJob, Detection, OCRResult, VerificationRecord
from app.services.demo_generator import generate_synthetic_page, generate_detections_for_page
from app.services.integrity_service import compute_sha256, generate_verification_id

STEPS = [
    "Document uploaded",
    "Quality analysis",
    "Image enhancement",
    "Layout detection",
    "OCR",
    "Sensitive element detection",
    "Protection",
    "Integrity verification",
    "Braille generation"
]

def run_processing_pipeline(db: Session, job_id: str):
    job = db.query(ProcessingJob).filter_by(id=job_id).first()
    if not job:
        return

    doc = db.query(Document).filter_by(id=job.document_id).first()
    if not doc:
        job.status = "failed"
        job.error = "Document not found"
        db.commit()
        return

    job.status = "running"
    job.started_at = datetime.datetime.utcnow()
    db.commit()

    completed = []
    for idx, step_name in enumerate(STEPS):
        job.current_step = step_name
        job.progress = round((idx / len(STEPS)) * 100, 1)
        db.commit()

        time.sleep(0.15) # fast simulation

        if step_name == "Quality analysis":
            doc.quality_score = 87.0
        elif step_name == "Layout detection":
            page_img = generate_synthetic_page(doc.id, 1, doc.original_name)
            dets = generate_detections_for_page(doc.id, 1)
            for d in dets:
                det_obj = Detection(
                    document_id=doc.id,
                    page=1,
                    category=d["category"],
                    bbox=d["bbox"],
                    confidence=d["confidence"],
                    sensitivity=d["sensitivity"],
                    action=d["action"]
                )
                db.add(det_obj)
        elif step_name == "OCR":
            ocr_obj = OCRResult(
                document_id=doc.id,
                page=1,
                language="English",
                language_confidence=0.96,
                source="demo",
                text="RAKSHADOC AI — DEMO ANALYSIS\nThis document is processed under Demo Mode.\nSensitive elements identified: Signature, Official Stamp, QR Code.",
                structured={"paragraphs": ["RAKSHADOC AI — DEMO ANALYSIS", "This document is processed under Demo Mode.", "Sensitive elements identified: Signature, Official Stamp, QR Code."]}
            )
            db.add(ocr_obj)
        elif step_name == "Integrity verification":
            sha = compute_sha256(doc.storage_path)
            doc.sha256_hash = sha
            doc.tamper_risk = "LOW"
            existing_ver = db.query(VerificationRecord).filter_by(document_id=doc.id).first()
            if not existing_ver:
                ver = VerificationRecord(
                    verification_id=generate_verification_id(sha),
                    document_id=doc.id,
                    document_hash=sha,
                    integrity_status="VALID",
                    tamper_risk="LOW",
                    sensitive_elements=3,
                    protected_copy_available=True,
                    braille_available=True
                )
                db.add(ver)

        completed.append(step_name)
        job.completed_steps = completed
        db.commit()

    job.status = "completed"
    job.progress = 100.0
    job.current_step = "Completed"
    job.completed_at = datetime.datetime.utcnow()
    doc.status = "completed"
    db.commit()
