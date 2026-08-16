# System Architecture — RakshaDoc AI

## System Topology

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                      │
│               Next.js App Router (TypeScript)           │
└────────────────────────────┬────────────────────────────┘
                             │ REST API / Auth Headers
┌────────────────────────────▼────────────────────────────┐
│                    FastAPI Backend                      │
│   ├── JWT Auth & Role Access Control                   │
│   ├── Image Processing & Protection (Pillow)           │
│   ├── SHA-256 Integrity Verification                   │
│   └── Braille Grade 1 Translator                       │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
┌──────────────▼─────────────┐  ┌─────────▼───────────────┐
│     SQLite / PostgreSQL    │  │     Private Storage     │
│   Users, Docs, Detections, │  │ Uploads & Rendered Pages│
│   Audit Logs & Records     │  │  (Never publicly exposed│
└────────────────────────────┘  └─────────────────────────┘
```

## Security Design

1. **Original Protection**: Uploaded files are stored in private storage with randomized UUID paths (`data/uploads/<uuid>/`). Originals are never overwritten or directly served over static routes.
2. **Access-Controlled Previews**: Page thumbnails and previews are served via authenticated / signed endpoints (`/api/documents/{id}/preview`).
3. **Permanent Redaction**: Protected document copies remove underlying pixels permanently rather than overlaying visual elements.
4. **Audit Logging**: All upload, process, redact, verify, and deletion operations write an audit log entry.
