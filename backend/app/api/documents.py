import os
import shutil
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models import Document, Detection, OCRResult, ProcessingJob, ProtectionRecord, VerificationRecord, AuditLog
from app.schemas import (
    DocumentOut, DocumentAnalysis, DetectionOut, OCRResultOut, ProcessingJobOut,
    VerificationRecordOut, ProtectRequest, ProtectedCopyOut, BrailleOutput, AuditEventOut
)
from app.services.processing_service import run_processing_pipeline, STEPS
from app.services.integrity_service import compute_sha256, generate_verification_id
from app.services.protection_service import apply_protection
from app.services.braille_service import translate_to_braille
from app.services.audit_service import log_audit
from app.services.demo_generator import generate_synthetic_page

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTS = set(settings.ALLOWED_EXTENSIONS.split(","))

@router.post("/upload", response_model=DocumentOut, status_code=201)
def upload_document(
    file: UploadFile = File(...),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    filename = file.filename or "uploaded_doc.png"
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported file format .{ext}")

    doc_id = str(uuid.uuid4())
    subfolder = os.path.join(settings.UPLOAD_DIR, doc_id)
    os.makedirs(subfolder, exist_ok=True)
    saved_path = os.path.join(subfolder, f"{doc_id}.{ext}")

    size_bytes = 0
    with open(saved_path, "wb") as f:
        while chunk := file.file.read(65536):
            f.write(chunk)
            size_bytes += len(chunk)

    if size_bytes > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        shutil.rmtree(subfolder, ignore_errors=True)
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit")

    sha = compute_sha256(saved_path)

    doc = Document(
        id=doc_id,
        owner_id=owner_id,
        original_name=filename,
        mime_type=file.content_type or "image/png",
        size_bytes=size_bytes,
        page_count=1,
        quality_score=87.0,
        status="uploaded",
        sha256_hash=sha,
        storage_path=saved_path
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    log_audit(db, "upload", user_id=owner_id, document_id=doc_id, detail=f"Uploaded {filename}")

    return DocumentOut(
        id=doc.id,
        original_name=doc.original_name,
        mime_type=doc.mime_type,
        size_bytes=doc.size_bytes,
        page_count=doc.page_count,
        quality_score=doc.quality_score,
        status=doc.status,
        sha256_hash=doc.sha256_hash,
        tamper_risk=doc.tamper_risk,
        analysis=None,
        created_at=doc.created_at.isoformat(),
        demo=True
    )

@router.post("/demo-sample", response_model=DocumentOut, status_code=201)
def create_demo_sample(
    sample_type: str = Query("certificate"),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc_id = str(uuid.uuid4())
    subfolder = os.path.join(settings.UPLOAD_DIR, doc_id)
    os.makedirs(subfolder, exist_ok=True)
    saved_path = os.path.join(subfolder, f"{doc_id}.png")

    # Generate synthetic page image
    generate_synthetic_page(doc_id, 1, f"Sample_{sample_type.title()}.png")
    page_1_path = os.path.join(settings.STORAGE_DIR, doc_id, "page_1.png")
    if os.path.exists(page_1_path):
        shutil.copyfile(page_1_path, saved_path)
    else:
        with open(saved_path, "wb") as f:
            f.write(b"SAMPLE")

    size_bytes = os.path.getsize(saved_path) if os.path.exists(saved_path) else 1024
    sha = compute_sha256(saved_path)

    doc = Document(
        id=doc_id,
        owner_id=owner_id,
        original_name=f"Demo_{sample_type.title()}.png",
        mime_type="image/png",
        size_bytes=size_bytes,
        page_count=1,
        quality_score=92.0,
        status="uploaded",
        sha256_hash=sha,
        storage_path=saved_path
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    log_audit(db, "upload_sample", user_id=owner_id, document_id=doc_id, detail=f"Created demo sample {sample_type}")

    return DocumentOut(
        id=doc.id,
        original_name=doc.original_name,
        mime_type=doc.mime_type,
        size_bytes=doc.size_bytes,
        page_count=doc.page_count,
        quality_score=doc.quality_score,
        status=doc.status,
        sha256_hash=doc.sha256_hash,
        tamper_risk=doc.tamper_risk,
        analysis=None,
        created_at=doc.created_at.isoformat(),
        demo=True
    )

@router.get("", response_model=List[DocumentOut])
def list_documents(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    docs = db.query(Document).filter_by(owner_id=owner_id).order_by(Document.created_at.desc()).all()
    res = []
    for d in docs:
        analysis = None
        if d.status == "completed":
            analysis = DocumentAnalysis()
        res.append(DocumentOut(
            id=d.id,
            original_name=d.original_name,
            mime_type=d.mime_type,
            size_bytes=d.size_bytes,
            page_count=d.page_count,
            quality_score=d.quality_score,
            status=d.status,
            sha256_hash=d.sha256_hash,
            tamper_risk=d.tamper_risk,
            analysis=analysis,
            created_at=d.created_at.isoformat(),
            demo=True
        ))
    return res

@router.get("/{id}", response_model=DocumentOut)
def get_document(
    id: str,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc = db.query(Document).filter_by(id=id, owner_id=owner_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    analysis = DocumentAnalysis() if doc.status == "completed" else None
    return DocumentOut(
        id=doc.id,
        original_name=doc.original_name,
        mime_type=doc.mime_type,
        size_bytes=doc.size_bytes,
        page_count=doc.page_count,
        quality_score=doc.quality_score,
        status=doc.status,
        sha256_hash=doc.sha256_hash,
        tamper_risk=doc.tamper_risk,
        analysis=analysis,
        created_at=doc.created_at.isoformat(),
        demo=True
    )

@router.post("/{id}/process", response_model=ProcessingJobOut, status_code=202)
def process_document(
    id: str,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc = db.query(Document).filter_by(id=id, owner_id=owner_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    job = db.query(ProcessingJob).filter_by(document_id=id).first()
    if not job:
        job = ProcessingJob(
            document_id=id,
            status="queued",
            progress=0.0,
            current_step="Queued",
            steps=STEPS,
            completed_steps=[]
        )
        db.add(job)
        db.commit()
        db.refresh(job)

    run_processing_pipeline(db, job.id)
    db.refresh(job)

    log_audit(db, "process", user_id=owner_id, document_id=id)

    return ProcessingJobOut(
        id=job.id,
        document_id=job.document_id,
        status=job.status,
        progress=job.progress,
        current_step=job.current_step,
        steps=job.steps,
        completed_steps=job.completed_steps or [],
        started_at=job.started_at.isoformat() if job.started_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        error=job.error
    )

@router.get("/{id}/processing", response_model=ProcessingJobOut)
def get_processing(
    id: str,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc = db.query(Document).filter_by(id=id, owner_id=owner_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    job = db.query(ProcessingJob).filter_by(document_id=id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")

    return ProcessingJobOut(
        id=job.id,
        document_id=job.document_id,
        status=job.status,
        progress=job.progress,
        current_step=job.current_step,
        steps=job.steps,
        completed_steps=job.completed_steps or [],
        started_at=job.started_at.isoformat() if job.started_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        error=job.error
    )

@router.get("/{id}/analysis", response_model=DocumentOut)
def get_analysis(
    id: str,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    return get_document(id, payload, db)

@router.get("/{id}/ocr", response_model=List[OCRResultOut])
def get_ocr(
    id: str,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc = db.query(Document).filter_by(id=id, owner_id=owner_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ocrs = db.query(OCRResult).filter_by(document_id=id).all()
    return [
        OCRResultOut(
            document_id=o.document_id,
            page=o.page,
            language=o.language,
            language_confidence=o.language_confidence,
            source=o.source,
            text=o.text,
            structured=o.structured
        ) for o in ocrs
    ]

@router.get("/{id}/detections", response_model=List[DetectionOut])
def get_detections(
    id: str,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc = db.query(Document).filter_by(id=id, owner_id=owner_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    dets = db.query(Detection).filter_by(document_id=id).all()
    return [
        DetectionOut(
            id=d.id,
            document_id=d.document_id,
            page=d.page,
            category=d.category,
            bbox=d.bbox,
            confidence=d.confidence,
            sensitivity=d.sensitivity,
            action=d.action
        ) for d in dets
    ]

@router.get("/{id}/preview")
def get_preview(
    id: str,
    page: int = 1,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc = db.query(Document).filter_by(id=id, owner_id=owner_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    page_file = os.path.join(settings.STORAGE_DIR, id, f"page_{page}.png")
    if not os.path.exists(page_file):
        generate_synthetic_page(id, page, doc.original_name)

    return FileResponse(page_file, media_type="image/png")

@router.post("/{id}/protect", response_model=ProtectedCopyOut)
def protect_document(
    id: str,
    req: ProtectRequest,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc = db.query(Document).filter_by(id=id, owner_id=owner_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    dets = db.query(Detection).filter_by(document_id=id).all()
    page_file = os.path.join(settings.STORAGE_DIR, id, "page_1.png")
    if not os.path.exists(page_file):
        generate_synthetic_page(id, 1, doc.original_name)

    protected_filename = f"protected_{uuid.uuid4().hex[:8]}.png"
    output_path = os.path.join(settings.STORAGE_DIR, id, protected_filename)

    apply_protection(page_file, dets, output_path, method=req.method, target_categories=req.elements)

    rec = ProtectionRecord(
        document_id=id,
        protection_level=req.level,
        method=req.method,
        elements=req.elements,
        file_path=output_path
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    log_audit(db, "protect", user_id=owner_id, document_id=id, detail=f"Method: {req.method}")

    return ProtectedCopyOut(
        id=rec.id,
        document_id=rec.document_id,
        protection_level=rec.protection_level,
        method=rec.method,
        elements=rec.elements,
        created_at=rec.created_at.isoformat(),
        download_url=f"/api/documents/{id}/protected-copy"
    )

@router.get("/{id}/protected-copy")
def get_protected_copy(
    id: str,
    download: Optional[int] = Query(None),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc = db.query(Document).filter_by(id=id, owner_id=owner_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    rec = db.query(ProtectionRecord).filter_by(document_id=id).order_by(ProtectionRecord.created_at.desc()).first()
    if not rec or not os.path.exists(rec.file_path):
        page_file = os.path.join(settings.STORAGE_DIR, id, "page_1.png")
        if not os.path.exists(page_file):
            generate_synthetic_page(id, 1, doc.original_name)
        dets = db.query(Detection).filter_by(document_id=id).all()
        protected_filename = f"protected_{uuid.uuid4().hex[:8]}.png"
        output_path = os.path.join(settings.STORAGE_DIR, id, protected_filename)
        apply_protection(page_file, dets, output_path, method="redact", target_categories=["signature", "stamp"])
        rec = ProtectionRecord(document_id=id, protection_level="high", method="redact", elements=["signature", "stamp"], file_path=output_path)
        db.add(rec)
        db.commit()
        db.refresh(rec)

    if download == 1:
        return FileResponse(rec.file_path, media_type="image/png", filename=f"protected_{doc.original_name}.png")

    return ProtectedCopyOut(
        id=rec.id,
        document_id=rec.document_id,
        protection_level=rec.protection_level,
        method=rec.method,
        elements=rec.elements,
        created_at=rec.created_at.isoformat(),
        download_url=f"/api/documents/{id}/protected-copy?download=1"
    )

@router.post("/{id}/verify", response_model=VerificationRecordOut)
def verify_document(
    id: str,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc = db.query(Document).filter_by(id=id, owner_id=owner_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ver = db.query(VerificationRecord).filter_by(document_id=id).first()
    if not ver:
        sha = compute_sha256(doc.storage_path)
        ver = VerificationRecord(
            verification_id=generate_verification_id(sha),
            document_id=id,
            document_hash=sha,
            integrity_status="VALID",
            tamper_risk="LOW",
            sensitive_elements=3,
            protected_copy_available=True,
            braille_available=True
        )
        db.add(ver)
        db.commit()
        db.refresh(ver)

    log_audit(db, "verify", user_id=owner_id, document_id=id)

    return VerificationRecordOut(
        id=ver.id,
        verification_id=ver.verification_id,
        document_id=ver.document_id,
        hash_algorithm=ver.hash_algorithm,
        document_hash=ver.document_hash,
        integrity_status=ver.integrity_status,
        tamper_risk=ver.tamper_risk,
        sensitive_elements=ver.sensitive_elements,
        protected_copy_available=ver.protected_copy_available,
        braille_available=ver.braille_available,
        created_at=ver.created_at.isoformat()
    )

@router.get("/{id}/braille", response_model=BrailleOutput)
def get_braille(
    id: str,
    language: Optional[str] = Query("English"),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc = db.query(Document).filter_by(id=id, owner_id=owner_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ocr = db.query(OCRResult).filter_by(document_id=id).first()
    extracted = ocr.text if ocr else f"RAKSHADOC AI DEMO CONTENT FOR {doc.original_name}"
    braille_unic = translate_to_braille(extracted, language or "English")

    return BrailleOutput(
        document_id=id,
        language=language or "English",
        braille_unicode=braille_unic,
        braille_bytes=len(braille_unic.encode("utf-8")),
        extracted_text=extracted,
        source="demo"
    )

@router.get("/{id}/audit", response_model=List[AuditEventOut])
def get_audit_logs(
    id: str,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc = db.query(Document).filter_by(id=id, owner_id=owner_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    logs = db.query(AuditLog).filter_by(document_id=id).order_by(AuditLog.created_at.desc()).all()
    return [
        AuditEventOut(
            id=l.id,
            user_id=l.user_id,
            document_id=l.document_id,
            action=l.action,
            detail=l.detail,
            created_at=l.created_at.isoformat()
        ) for l in logs
    ]

@router.delete("/{id}", status_code=204)
def delete_document(
    id: str,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    owner_id = payload.get("sub")
    doc = db.query(Document).filter_by(id=id, owner_id=owner_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    shutil.rmtree(os.path.join(settings.UPLOAD_DIR, id), ignore_errors=True)
    shutil.rmtree(os.path.join(settings.STORAGE_DIR, id), ignore_errors=True)

    db.query(Document).filter_by(id=id).delete()
    db.commit()

    log_audit(db, "delete", user_id=owner_id, document_id=id)
    return None
