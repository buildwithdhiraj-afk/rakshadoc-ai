import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
from app.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False) # guest, user, admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, default=gen_uuid)
    owner_id = Column(String, index=True, nullable=False)
    original_name = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    page_count = Column(Integer, default=1)
    quality_score = Column(Float, nullable=True)
    status = Column(String, default="uploaded") # uploaded, processing, completed, failed
    sha256_hash = Column(String, nullable=True)
    tamper_risk = Column(String, nullable=True) # LOW, MEDIUM, HIGH
    storage_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Detection(Base):
    __tablename__ = "detections"
    id = Column(String, primary_key=True, default=gen_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    page = Column(Integer, default=1)
    category = Column(String, nullable=False)
    bbox = Column(JSON, nullable=False) # {x, y, w, h} normalized 0..1
    confidence = Column(Float, nullable=False)
    sensitivity = Column(String, nullable=False) # HIGH, MEDIUM, LOW, NONE
    action = Column(String, nullable=False) # PROTECTED, NONE

class OCRResult(Base):
    __tablename__ = "ocr_results"
    id = Column(String, primary_key=True, default=gen_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    page = Column(Integer, default=1)
    language = Column(String, nullable=False)
    language_confidence = Column(Float, default=0.95)
    source = Column(String, default="demo")
    text = Column(Text, nullable=False)
    structured = Column(JSON, nullable=False) # {paragraphs: [...]}

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    id = Column(String, primary_key=True, default=gen_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    status = Column(String, default="queued") # queued, running, completed, failed
    progress = Column(Float, default=0.0)
    current_step = Column(String, nullable=True)
    steps = Column(JSON, nullable=False)
    completed_steps = Column(JSON, default=list)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error = Column(String, nullable=True)

class VerificationRecord(Base):
    __tablename__ = "verification_records"
    id = Column(String, primary_key=True, default=gen_uuid)
    verification_id = Column(String, unique=True, index=True, nullable=False)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    hash_algorithm = Column(String, default="SHA-256")
    document_hash = Column(String, nullable=False)
    integrity_status = Column(String, default="VALID")
    tamper_risk = Column(String, default="LOW")
    sensitive_elements = Column(Integer, default=0)
    protected_copy_available = Column(Boolean, default=False)
    braille_available = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ProtectionRecord(Base):
    __tablename__ = "protection_records"
    id = Column(String, primary_key=True, default=gen_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    protection_level = Column(String, default="high")
    method = Column(String, default="redact")
    elements = Column(JSON, nullable=False)
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=True)
    document_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    detail = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
