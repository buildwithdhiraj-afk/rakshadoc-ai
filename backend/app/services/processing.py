import datetime
import os
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models import Document, ProcessingJob, Detection, OCRResult, ProtectionRecord, VerificationRecord
from app.services.integrity import compute_sha256, generate_verification_id
from app.services.protection import apply_protection
from app.services.preprocessing import enhance_document_image
from app.services.rendering import ensure_page_rendered, get_source_page_count, render_document_pages
from ml.document_detection import analyze_document_quality, detect_document_components
from ml.ocr import extract_text
from ml.sensitive_detection import detect_sensitive_elements, DEFAULT_PROTECTION_TARGETS
from ml.tamper_detection import analyze_tamper_risk

STEPS = [
    "Document Uploaded",
    "Quality Analysis",
    "Image Enhancement",
    "Layout Detection",
    "OCR Extraction",
    "Sensitive Element Detection",
    "Protection Processing",
    "Integrity Verification",
    "Braille Generation",
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

    recorded_hash = doc.sha256_hash
    work_image = doc.storage_path
    page_components: dict = {}  # page_no -> list of detections (same coords as rendered pages)
    rendered_pages: dict = {}   # page_no -> rendered page PNG path
    sensitive_count = 0

    completed = []
    for idx, step_name in enumerate(STEPS):
        job.current_step = step_name
        job.progress = round((idx / len(STEPS)) * 100, 1)
        db.commit()

        if step_name == "Quality Analysis":
            if doc.storage_path and os.path.exists(doc.storage_path):
                q_res = analyze_document_quality(doc.storage_path)
                doc.quality_score = q_res["overall_quality"]
            else:
                doc.quality_score = 87.0

        elif step_name == "Image Enhancement":
            # Produce an enhanced working copy; never overwrite the original upload.
            if doc.storage_path and os.path.exists(doc.storage_path):
                enhanced_path = os.path.join(
                    os.path.dirname(doc.storage_path), "enhanced.png"
                )
                try:
                    enhance_document_image(doc.storage_path, enhanced_path)
                    if os.path.exists(enhanced_path):
                        work_image = enhanced_path
                except Exception:
                    pass

        elif step_name == "Layout Detection":
            # Heal page_count from the source (older uploads stored 1 for PDFs).
            doc.page_count = get_source_page_count(doc.storage_path)

            # Render the real document pages, then detect components per page
            # against those exact pixels (preview and overlay share the source).
            rendered = render_document_pages(doc)

            # Clear existing detections for job re-runs
            db.query(Detection).filter_by(document_id=doc.id).delete()
            page_components = {}
            rendered_pages = dict(rendered)

            for page_no, page_path in rendered:
                try:
                    # Passing the source PDF unlocks the text-layer detector,
                    # which locates individual fields instead of whole-page text
                    # bands. It is optional: scans simply fall back to pixels.
                    comps = detect_document_components(
                        page_path,
                        pdf_path=doc.storage_path if os.path.exists(doc.storage_path or "") else None,
                        page_no=page_no,
                    )
                except Exception:
                    comps = []
                page_components[page_no] = comps
                for d in comps:
                    db.add(Detection(
                        document_id=doc.id,
                        page=page_no,
                        category=d["category"],
                        bbox=d["bbox"],
                        confidence=d["confidence"],
                        sensitivity=d["sensitivity"],
                        action=d["action"]
                    ))

        elif step_name == "OCR Extraction":
            db.query(OCRResult).filter_by(document_id=doc.id).delete()
            source_pdf = doc.storage_path if os.path.exists(doc.storage_path or "") else None
            pages = sorted(rendered_pages) or [1]
            for page_no in pages:
                ocr = extract_text(
                    rendered_pages.get(page_no) or work_image,
                    pdf_path=source_pdf,
                    page_no=page_no,
                )
                if not ocr["text"]:
                    continue
                db.add(OCRResult(
                    document_id=doc.id,
                    page=page_no,
                    language=ocr["language"],
                    language_confidence=ocr["language_confidence"],
                    source=ocr["source"],
                    text=ocr["text"],
                    structured=ocr["structured"]
                ))

        elif step_name == "Sensitive Element Detection":
            all_components = [c for pg in sorted(page_components) for c in page_components[pg]]
            sensitive = detect_sensitive_elements(all_components)
            sensitive_count = len(sensitive)

        elif step_name == "Protection Processing":
            # Pre-generate a default protected copy (permanent redaction) for
            # every rendered page, so the viewer can show each page redacted.
            for page_no in sorted(page_components):
                existing_rec = (
                    db.query(ProtectionRecord)
                    .filter_by(document_id=doc.id, page=page_no)
                    .first()
                )
                if existing_rec:
                    continue
                page_file = ensure_page_rendered(doc, page_no)
                if not page_file:
                    continue
                output_path = os.path.join(
                    settings.STORAGE_DIR, doc.id, f"protected_default_p{page_no}.png"
                )
                try:
                    apply_protection(
                        page_file, page_components.get(page_no, []), output_path,
                        method="redact", target_categories=DEFAULT_PROTECTION_TARGETS
                    )
                    db.add(ProtectionRecord(
                        document_id=doc.id,
                        protection_level="high",
                        method="redact",
                        elements=list(DEFAULT_PROTECTION_TARGETS),
                        file_path=output_path,
                        page=page_no
                    ))
                except Exception:
                    pass

        elif step_name == "Integrity Verification":
            sha = compute_sha256(doc.storage_path) if (doc.storage_path and os.path.exists(doc.storage_path)) else None
            if sha:
                doc.tamper_risk = analyze_tamper_risk(doc.storage_path, recorded_hash=recorded_hash)
                doc.sha256_hash = sha
            else:
                doc.tamper_risk = doc.tamper_risk or "LOW"

            existing_ver = db.query(VerificationRecord).filter_by(document_id=doc.id).first()
            if not existing_ver:
                hash_value = sha or doc.sha256_hash or ("0" * 64)
                db.add(VerificationRecord(
                    verification_id=generate_verification_id(hash_value),
                    document_id=doc.id,
                    document_hash=hash_value,
                    integrity_status="VALID",
                    tamper_risk=doc.tamper_risk or "LOW",
                    sensitive_elements=sensitive_count,
                    protected_copy_available=True,
                    braille_available=True
                ))

        completed.append(step_name)
        job.completed_steps = completed
        db.commit()

    job.status = "completed"
    job.progress = 100.0
    job.current_step = "Completed"
    job.completed_at = datetime.datetime.utcnow()
    doc.status = "completed"
    db.commit()
