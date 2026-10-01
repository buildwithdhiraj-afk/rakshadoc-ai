from typing import List
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
