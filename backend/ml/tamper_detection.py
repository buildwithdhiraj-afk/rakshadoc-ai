"""Tamper-risk indicator based on SHA-256 file integrity.

The indicator compares the file's current hash with the hash recorded at
upload time. It is a technical signal only — NOT legal proof of forgery
or authenticity.
"""
import hashlib
import os


def compute_file_hash(document_path: str) -> str:
    sha = hashlib.sha256()
    with open(document_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha.update(chunk)
    return sha.hexdigest()


def analyze_tamper_risk(document_path: str, recorded_hash: str = None) -> str:
    """Return LOW / MEDIUM / HIGH tamper-risk indicator for a document file."""
    if not document_path or not os.path.exists(document_path):
        return "MEDIUM"

    current_hash = compute_file_hash(document_path)

    if not recorded_hash:
        return "LOW"

    if current_hash == recorded_hash:
        return "LOW"
    return "HIGH"
