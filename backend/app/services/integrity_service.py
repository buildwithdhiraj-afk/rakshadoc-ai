import hashlib
from app.models import VerificationRecord

def compute_sha256(file_path: str) -> str:
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()

def generate_verification_id(doc_hash: str) -> str:
    return f"DOC-{doc_hash[:6].upper()}"
