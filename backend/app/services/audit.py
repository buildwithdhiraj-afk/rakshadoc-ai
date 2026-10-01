from sqlalchemy.orm import Session
from app.models import AuditLog

def log_audit(db: Session, action: str, user_id: str = None, document_id: str = None, detail: str = None):
    log = AuditLog(
        action=action,
        user_id=user_id,
        document_id=document_id,
        detail=detail
    )
    db.add(log)
    db.commit()
    return log
