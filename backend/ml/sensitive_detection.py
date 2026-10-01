"""Sensitive element detection helpers.

Works on top of the components detected by `ml.document_detection` to
identify which elements carry privacy sensitivity (signatures, stamps,
seals, QR codes, identity numbers, ...).
"""

SENSITIVE_CATEGORIES = {
    "signature",
    "stamp",
    "seal",
    "qr_code",
    "identity_number",
    "financial_info",
    "person",
    "date",
    "address",
}

# Default elements targeted by permanent redaction.
DEFAULT_PROTECTION_TARGETS = ["signature", "stamp", "seal", "qr_code"]


def detect_sensitive_elements(components: list) -> list:
    """Return the sensitive subset of detected document components."""
    return [
        c for c in components
        if c.get("category") in SENSITIVE_CATEGORIES or c.get("sensitivity") in ("HIGH", "MEDIUM")
    ]
