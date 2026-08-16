# RakshaDoc AI — API Contract

Base URL: `/api`
JSON responses unless stated. All authenticated endpoints require `Authorization: Bearer <JWT>`.

## Roles

- `guest` — limited processing (demo, in-memory, no history).
- `user` — full document pipeline + history.
- `admin` / `researcher` — metrics, experiments, audit logs, system health, model versions.

## Objects

### User
```json
{ "id": "string", "email": "string", "full_name": "string", "role": "user" }
```

### Document
```json
{
  "id": "uuid",
  "original_name": "string",
  "mime_type": "string",
  "size_bytes": 123456,
  "page_count": 4,
  "quality_score": 87.0,
  "status": "uploaded|processing|completed|failed",
  "sha256_hash": "hex",
  "tamper_risk": "LOW|MEDIUM|HIGH|null",
  "analysis": { "layout": "Complete", "ocr": "Complete", "sensitive_elements": 3,
                "integrity": "Verified", "protected_copy": "Available", "braille": "Available" } | null,
  "created_at": "ISO8601"
}
```

### Detection
```json
{
  "id": "uuid", "document_id": "uuid", "page": 1,
  "category": "title|heading|paragraph|table|figure|list|signature|stamp|seal|logo|qr_code",
  "bbox": { "x": 0.1, "y": 0.1, "w": 0.3, "h": 0.2 },
  "confidence": 0.964,
  "sensitivity": "HIGH|MEDIUM|LOW|NONE",
  "action": "PROTECTED|NONE"
}
```

> **Coordinate convention:** all `bbox` values are **normalized 0..1** relative to the full page
> (x = left edge, y = top edge, w = width, h = height). The frontend renders boxes with
> percentages regardless of the rendered image size. Demo preview images are always rendered at
> width 800 (height varies by page aspect), and detections are stored normalized.

### OCR Result
```json
{
  "document_id": "uuid", "page": 1,
  "language": "Marathi",
  "language_confidence": 0.94,
  "source": "demo" ,
  "text": "line1\nline2",
  "structured": { "paragraphs": ["..."] }
}
```

### Processing Job
```json
{
  "id": "uuid", "document_id": "uuid", "status": "queued|running|completed|failed",
  "progress": 0.58, "current_step": "Detecting document layout...",
  "steps": ["Document uploaded", "Quality analysis", "Image enhancement", "Layout detection",
            "OCR", "Sensitive element detection", "Protection", "Integrity verification",
            "Braille generation"],
  "started_at": "ISO8601", "completed_at": "ISO8601|null", "error": "string|null"
}
```

### Verification Record
```json
{
  "id": "uuid", "verification_id": "DOC-8F29A1",
  "document_id": "uuid", "hash_algorithm": "SHA-256",
  "document_hash": "hex",
  "integrity_status": "VALID|TAMPERED|UNVERIFIED",
  "tamper_risk": "LOW|MEDIUM|HIGH",
  "sensitive_elements": 3,
  "protected_copy_available": true, "braille_available": true,
  "created_at": "ISO8601"
}
```

### Protected Copy
```json
{
  "id": "uuid", "document_id": "uuid", "protection_level": "high",
  "method": "redact|blur|pixelate|mask",
  "elements": ["signature", "stamp", "qr_code"],
  "created_at": "ISO8601"
}
```

### Braille Output
```json
{
  "document_id": "uuid", "language": "Marathi",
  "braille_unicode": "⠠⠙⠕⠉",
  "braille_bytes": 120, "extracted_text": "...",
  "source": "demo"
}
```

### Audit Event
```json
{ "id": "uuid", "user_id": "uuid|null", "document_id": "uuid|null",
  "action": "string", "detail": "string|null", "created_at": "ISO8601" }
```

## Endpoints

### Auth
| Method | Path | Body | Auth | Returns |
|---|---|---|---|---|
| POST | `/auth/register` | `{email, password, full_name}` | – | `{token, user}` |
| POST | `/auth/login` | `{email, password}` | – | `{token, user}` |
| POST | `/auth/guest` | `{name?: string}` | – | `{token, user}` (role `guest`) |
| GET | `/auth/me` | – | Bearer | `User` |

Validation: email format, password min 8 chars. Errors: 400 invalid payload, 401 wrong creds, 409 email exists.

Guests get a signed ephemeral token; guest documents are owned by a random guest id and may be cleaned up by retention.

### Documents
| Method | Path | Body | Auth | Returns |
|---|---|---|---|---|
| POST | `/documents/upload` | multipart `file` | Bearer/guest | `Document` (201) |
| GET | `/documents` | – | Bearer/guest | `Document[]` |
| GET | `/documents/{id}` | – | owner | `Document` |
| POST | `/documents/{id}/process` | – | owner | `ProcessingJob` (202) |
| GET | `/documents/{id}/processing` | – | owner | `ProcessingJob` |
| GET | `/documents/{id}/analysis` | – | owner | `Document` (with analysis) |
| GET | `/documents/{id}/ocr` | – | owner | `OCRResult[]` |
| GET | `/documents/{id}/detections` | – | owner | `Detection[]` |
| GET | `/documents/{id}/preview?page=1` | – | owner (signed) | image/png |
| POST | `/documents/{id}/protect` | `{level, method, elements[]}` | owner | `ProtectedCopy` |
| GET | `/documents/{id}/protected-copy` | – | owner (signed) | `ProtectedCopy` + download link |
| POST | `/documents/{id}/verify` | – | owner | `VerificationRecord` |
| GET | `/documents/{id}/braille?language=` | – | owner | `BrailleOutput` |
| GET | `/documents/{id}/audit` | – | owner | `AuditEvent[]` |
| DELETE | `/documents/{id}` | – | owner | 204 |

Upload validation: extension + MIME allowlist, `MAX_UPLOAD_SIZE_MB`, `MAX_PAGES`. Errors: 400 unsupported format / too large, 404 not found, 403 forbidden.

### Public verification
| Method | Path | Returns |
|---|---|---|
| GET | `/verify/{verification_id}` | safe public metadata: `{verification_id, document_id_masked, integrity_status, tamper_risk, protected_copy_available, braille_available, created_at, version, notice}` |

### Admin / Research (admin/researcher role only)
| Method | Path | Returns |
|---|---|---|
| GET | `/admin/metrics` | system + model metrics (`not_evaluated` where unmeasured) |
| GET | `/admin/experiments` | experiment list with status + metrics |
| GET | `/admin/audit-logs` | recent `AuditEvent[]` |
| GET | `/admin/models` | model versions / load state |

### Health
| Method | Path | Returns |
|---|---|---|
| GET | `/health` | `{status: "ok", demo_mode, version, model_available, uptime_s}` |

## Errors
```json
{ "detail": "human readable message", "code": "FILE_TOO_LARGE" }
```
Never return stack traces. Use HTTP status codes consistently.

## Demo mode
When `DEMO_MODE=true`: all AI outputs are simulated deterministically (seeded) and tagged
`"source": "demo"`. Hash verification and Braille translation are REAL. Protected copies are real
image transformations of the demo preview. The frontend must display **Demo Analysis**, never
**AI Verified**, while `source: demo`.

## Download flow (private storage)
Original uploads and protected copies live in private storage. The frontend requests preview /
protected-copy images through signed endpoints (`?token=`) issued only to the owner. Originals are
never exposed through public URLs.
