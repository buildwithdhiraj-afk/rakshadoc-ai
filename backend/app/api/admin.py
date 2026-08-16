from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_admin
from app.models import Document, AuditLog
from app.schemas import AuditEventOut

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/metrics")
def get_admin_metrics(
    payload: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_docs = db.query(Document).count()
    return {
        "documents_processed": total_docs,
        "average_processing_time_s": 1.35,
        "layout_map": None,
        "ocr_accuracy": None,
        "sensitive_map": None,
        "tamper_f1": None,
        "model_size_mb": None,
        "average_memory_mb": None,
        "model_available": False,
        "demo_mode": True
    }

@router.get("/experiments")
def get_experiments(payload: dict = Depends(require_admin)):
    exp_names = [
        ("Experiment 1", "Baseline", "Default baseline configuration"),
        ("Experiment 2", "Augmentation", "Data augmentation optimization"),
        ("Experiment 3", "Enhancement", "Image preprocessing & enhancement"),
        ("Experiment 4", "Fine-Tuning", "Fine-tuning layout backbone"),
        ("Experiment 5", "Small Object Optimization", "Small detection box anchor optimization"),
        ("Experiment 6", "Compression", "Model quantization and compression"),
        ("Experiment 7", "Sensitive Element Detection", "Signature and stamp detection module"),
        ("Experiment 8", "Secure Redaction", "Pixel-level redaction verification"),
        ("Experiment 9", "Tamper Analysis", "Tamper-risk classifier evaluation"),
        ("Experiment 10", "Braille Accessibility", "Indic character to Braille mapping"),
    ]
    return [
        {
            "id": f"exp_{i+1}",
            "name": name,
            "short_name": short,
            "description": desc,
            "status": "not_evaluated",
            "metrics": {"mAP": None, "Precision": None, "Recall": None, "F1": None, "Inference_ms": None, "Size_MB": None},
            "evaluated_at": None
        } for i, (short, name, desc) in enumerate(exp_names)
    ]

@router.get("/audit-logs", response_model=List[AuditEventOut])
def get_all_audit_logs(
    payload: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
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

@router.get("/models")
def get_model_info(payload: dict = Depends(require_admin)):
    return [
        {
            "name": "IndicDLP Layout Engine",
            "version": "1.0-demo",
            "available": False,
            "backend": "demo",
            "loaded": False,
            "input": "PDF / Image",
            "notes": "Running in Demo Mode. Connect PyTorch weights to enable inference."
        },
        {
            "name": "Multilingual OCR Engine",
            "version": "1.0-demo",
            "available": False,
            "backend": "demo",
            "loaded": False,
            "input": "Image Bounding Region",
            "notes": "Running in Demo Mode. Connect Tesseract / PaddleOCR / EasyOCR to enable OCR."
        }
    ]
