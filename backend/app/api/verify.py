from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import VerificationRecord
from app.schemas import PublicVerificationOut

router = APIRouter(prefix="/verify", tags=["public_verify"])

@router.get("/{verification_id}", response_model=PublicVerificationOut)
def verify_public(verification_id: str, db: Session = Depends(get_db)):
    ver = db.query(VerificationRecord).filter_by(verification_id=verification_id).first()
    if not ver:
        raise HTTPException(status_code=404, detail="Verification record not found")

    masked_id = f"{ver.document_id[:8]}..."
    return PublicVerificationOut(
        verification_id=ver.verification_id,
        document_id_masked=masked_id,
        integrity_status=ver.integrity_status,
        tamper_risk=ver.tamper_risk,
        protected_copy_available=ver.protected_copy_available,
        braille_available=ver.braille_available,
        created_at=ver.created_at.isoformat()
    )
