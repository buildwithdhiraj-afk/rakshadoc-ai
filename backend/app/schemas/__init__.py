from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str

class TokenResponse(BaseModel):
    token: str
    user: UserOut

class DocumentAnalysis(BaseModel):
    layout: str = "Complete"
    ocr: str = "Complete"
    sensitive_elements: int = 0
    integrity: str = "Verified"
    protected_copy: str = "Available"
    braille: str = "Available"

class DocumentOut(BaseModel):
    id: str
    original_name: str
    mime_type: str
    size_bytes: int
    page_count: int
    quality_score: Optional[float] = None
    status: str
    sha256_hash: Optional[str] = None
    tamper_risk: Optional[str] = None
    analysis: Optional[DocumentAnalysis] = None
    created_at: str
    demo: bool = True

class BBox(BaseModel):
    x: float
    y: float
    w: float
    h: float

class DetectionOut(BaseModel):
    id: str
    document_id: str
    page: int
    category: str
    bbox: BBox
    confidence: float
    sensitivity: str
    action: str

class OCRResultOut(BaseModel):
    document_id: str
    page: int
    language: str
    language_confidence: float
    source: str
    text: str
    structured: Dict[str, List[str]]

class ProcessingJobOut(BaseModel):
    id: str
    document_id: str
    status: str
    progress: float
    current_step: Optional[str] = None
    steps: List[str]
    completed_steps: List[str]
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error: Optional[str] = None

class VerificationRecordOut(BaseModel):
    id: str
    verification_id: str
    document_id: str
    hash_algorithm: str
    document_hash: str
    integrity_status: str
    tamper_risk: str
    sensitive_elements: int
    protected_copy_available: bool
    braille_available: bool
    created_at: str

class PublicVerificationOut(BaseModel):
    verification_id: str
    document_id_masked: str
    integrity_status: str
    tamper_risk: str
    protected_copy_available: bool
    braille_available: bool
    created_at: str
    version: str = "1.0"
    notice: str = "This verification confirms recorded file integrity information. It is not a legal certification of document authenticity."

class ProtectRequest(BaseModel):
    level: str = "high"
    method: str = "redact"
    elements: List[str]

class ProtectedCopyOut(BaseModel):
    id: str
    document_id: str
    protection_level: str
    method: str
    elements: List[str]
    created_at: str
    download_url: Optional[str] = None

class BrailleOutput(BaseModel):
    document_id: str
    language: str
    braille_unicode: str
    braille_bytes: int
    extracted_text: str
    source: str = "demo"

class AuditEventOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    document_id: Optional[str] = None
    action: str
    detail: Optional[str] = None
    created_at: str
