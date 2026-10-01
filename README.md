# RakshaDoc AI

**Understand. Protect. Verify. Access.**

Secure and Accessible AI-Powered Document Intelligence for Multilingual Indian Documents.

RakshaDoc AI is a full-stack academic document-intelligence platform that combines layout analysis, computer vision, OCR, sensitive-element detection, signature/stamp protection, privacy-preserving redaction, integrity verification, tamper-risk analysis, multilingual text extraction, and Braille accessibility.

> **Important:** RakshaDoc AI is designed to **protect**, **detect**, **verify** and **access** documents.
> It is NOT designed to reproduce signatures, clone signatures, recreate government stamps, forge documents, or claim legal authenticity. Integrity verification confirms file integrity only — it is not a legal certification of authenticity.

**Current version:** Backend `1.0.0` · Frontend `0.1.0` · License: private/academic project · © 2026 RakshaDoc AI

---

## Table of Contents

- [Demo Mode](#demo-mode)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Backend](#backend)
  - [API Endpoints](#api-endpoints)
  - [Auth & Roles](#auth--roles)
  - [Services](#services)
  - [Database Schema](#database-schema)
  - [Security Middleware](#security-middleware)
- [Frontend](#frontend)
  - [Landing Page](#landing-page)
  - [Pages & Routes](#pages--routes)
  - [Dashboard](#dashboard)
- [ML Layer](#ml-layer)
- [Core Modules](#core-modules)
- [Testing](#testing)
- [Scripts & Tooling](#scripts--tooling)
- [Documentation Index](#documentation-index)
- [Security & Privacy](#security--privacy)
- [Known Limitations](#known-limitations)
- [Disclaimer](#disclaimer)

---

## Demo Mode

The backend runs in **Demo Mode** by default (`DEMO_MODE=true`).

- Analysis responses are **clearly-labelled simulated results**, tagged `"source":"demo"` / `demo: true`.
- The UI shows **"Demo Analysis"** (never "AI Verified") and a **Demo Mode** badge.
- Synthetic demo pages are deterministically generated (seeded by `DEMO_SEED`) and watermarked *"DEMO DOCUMENT — NOT AN OFFICIAL DOCUMENT"*.
- **Real, functional features even in demo mode:** bcrypt+JWT auth, upload validation, SHA-256 hashing, OpenCV quality scoring & component detection, Pillow redaction (redact/blur), Braille Grade 1 translation (Latin + Devanagari), audit logging, public verification portal, security headers.

---

## Architecture

```
┌────────────────────┐     REST + Bearer JWT      ┌─────────────────────────┐
│  Browser           │ ─────────────────────────► │  FastAPI Backend        │
│  Next.js App Router│ ◄───────────────────────── │  JWT auth · RBAC        │
│  TypeScript        │                            │  Pillow · OpenCV        │
│  Tailwind CSS 4    │                            │  SHA-256 · Braille G1   │
└────────────────────┘                            └────────┬────────────────┘
                                                           │
                                            ┌──────────────┴──────────────┐
                                            ▼                             ▼
                                   ┌──────────────────┐        ┌─────────────────────┐
                                   │ SQLite (dev) /   │        │ Private storage     │
                                   │ PostgreSQL (prod)│        │ data/uploads/<uuid> │
                                   │ 8 tables         │        │ data/storage/<uuid> │
                                   └──────────────────┘        └─────────────────────┘
```

### Security design decisions

1. Originals are stored at randomized UUID paths (`data/uploads/<uuid>/`), never overwritten, never served over static routes.
2. Previews are served via authenticated endpoints (`/api/documents/{id}/preview`); auth works via `Authorization: Bearer` header **or** `?token=` query param (same JWT).
3. Permanent redaction removes underlying pixels (not overlays).
4. Every upload / process / redact / verify / delete operation writes an audit-log entry.

### 9-step processing pipeline

1. Document Uploaded
2. Quality Analysis
3. Image Enhancement
4. Layout Detection
5. OCR Extraction
6. Sensitive Element Detection
7. Protection Processing
8. Integrity Verification
9. Braille Generation

---

## Tech Stack

| Layer | Tech | Version (installed) |
|-------|------|---------------------|
| Frontend | Next.js (App Router, Turbopack) | 16.3.1 |
| UI | React, TypeScript, Tailwind CSS, shadcn-style components, Lucide icons | React 19.2.8, TS 5, Tailwind 4 |
| UI primitives | Radix UI wrappers (avatar, checkbox, dialog, dropdown, label, progress, radio, select, separator, switch, tabs, tooltip) | via shadcn-style wrappers |
| Extras | `qrcode.react`, `sonner` (toasts), `clsx`, `tailwind-merge`, `class-variance-authority` | — |
| Linting | ESLint 9 + `eslint-config-next` | 16.3.1 |
| Backend | Python, FastAPI, Uvicorn, SQLAlchemy 2, Pydantic 2, pydantic-settings | FastAPI 0.128.x, Uvicorn 0.39.x |
| Auth | bcrypt password hashing, PyJWT (HS256) | bcrypt 5.x, PyJWT 2.13 |
| Database | **SQLite** (dev default: `backend/data/rakshadoc.db`) · **PostgreSQL** (production) | SQLAlchemy 2.0 |
| Computer vision | OpenCV (headless), Pillow, NumPy | opencv 5.x, pillow 11.x, numpy 2.x |
| PDF | PyMuPDF (fitz) | 1.26.x |
| OCR | Modular layer — currently demo stub (`source: "demo"`) | — |
| ML layer | Flat modules in `backend/ml/` (document_detection, ocr, sensitive_detection, tamper_detection) | demo implementations |
| Tests | pytest + FastAPI TestClient + httpx | pytest 8.4.x |

> **Note:** PyTorch and pandas are **not** dependencies. There is no Docker setup — the project runs directly with Uvicorn + Next.js.

---

## Quick Start

### Prerequisites

- Python 3.9+ (project venv is 3.12)
- Node.js 20+ (Next.js 16)
- Optional: PostgreSQL (production only; dev uses SQLite automatically)

### One-command dev launch

```bash
python start.py
```

Spawns backend on **:8000** and frontend on **:3000** (frontend starts after a 3s delay).

### Backend (manual)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

# Config: backend reads .env from the current working directory.
# Either run from repo root, or copy .env into backend/:
copy ..\.env.example ..\.env    # then edit values

uvicorn app.main:app --reload --port 8000
```

- Interactive API docs (Swagger): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/api/health

On startup the app runs `Base.metadata.create_all()` and, in development, seeds two users if they are missing (password logged to the console): `user@rakshadoc.dev` / `admin@rakshadoc.dev`, password `RakshaDoc!Dev1` — change these outside development.

> **Note:** the dev seed domain must use a real TLD. `.local` (and `.test`/`.invalid`) are special-use names that `pydantic.EmailStr` rejects, which would make the seeded accounts impossible to log into.

### Frontend (manual)

```bash
cd frontend
npm install
# Create frontend/.env.local (or rely on defaults):
#   NEXT_PUBLIC_API_URL=http://localhost:8000/api
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000
npm run dev
```

App: **http://localhost:3000**

### Database

- **Development:** SQLite at `backend/data/rakshadoc.db` (created automatically; no setup needed).
- **Production:** set `DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/dbname`.
- Tables are created on startup via `create_all()`. **Alembic is not yet integrated.**

---

## Environment Configuration

Template: [`.env.example`](.env.example) (copy to `.env` at repo root; never commit `.env`).

| Variable | Default | Purpose |
|----------|---------|---------|
| `ENVIRONMENT` | `development` | Enables dev user seeding; affects SECRET_KEY validation |
| `SECRET_KEY` | dev fallback | **Required** (long random string) in non-dev; JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `120` | JWT lifetime |
| `DATABASE_URL` | `sqlite:///./data/rakshadoc.db` (code default) | SQLAlchemy database URL |
| `UPLOAD_DIR` | `./data/uploads` | Private original uploads (`<uuid>/<uuid>.<ext>`) |
| `STORAGE_DIR` | `./data/storage` | Rendered pages + protected copies |
| `MAX_UPLOAD_SIZE_MB` | `25` | Upload size limit (else HTTP 400) |
| `MAX_PAGES` | `100` | Page-count cap |
| `ALLOWED_EXTENSIONS` | `pdf,png,jpg,jpeg,tiff,tif,bmp,webp` | Extension allowlist |
| `DEMO_MODE` | `true` | Simulated analysis until real models wired |
| `DEMO_SEED` | `42` | Determinism for synthetic pages/detections |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins (never `*` with auth) |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | Base for public verification links |
| `RETENTION_DAYS` | `90` | Configured retention policy (cleanup worker not implemented) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Frontend → backend base URL |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Frontend site URL |

---

## Project Structure

```
RAKSHADOC AI/
├── README.md                 # this file
├── .env / .env.example       # runtime config (gitignored) + template
├── start.py                  # one-command launcher (backend + frontend)
│
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app, lifespan, middleware, routers
│   │   ├── api/              # auth, documents, verify, admin, health
│   │   ├── core/             # config, database, security (JWT/bcrypt), middleware
│   │   ├── models/           # 8 SQLAlchemy models
│   │   └── schemas/          # Pydantic request/response schemas
│   ├── services/             # 7 service modules (see below)
│   ├── ml/                   # flat ML layer (document_detection, ocr, sensitive, tamper)
│   ├── tests/                # pytest suite (8 tests: auth, documents, braille)
│   ├── data/                 # SQLite DB + uploads/ + storage/ (gitignored content)
│   ├── requirements.txt
│   └── .venv/
│
├── frontend/
│   ├── app/                  # Next.js App Router pages (public + dashboard)
│   ├── components/           # ui/ (20), dashboard/, site-*, empty/error-state, logo
│   ├── hooks/                # use-auth, use-media-query
│   ├── lib/                  # api.ts (typed ApiClient), utils.ts
│   ├── types/                # index.ts — 23 shared types
│   ├── public/               # static assets
│   ├── package.json
│   └── next.config.ts
│
├── data/                     # root-level data dir (storage/, uploads/)
├── docs/                     # architecture, api, database, deployment
└── scripts/
    └── test_demo.py          # end-to-end API smoke demo (10 steps)
```

---

## Backend

**Entrypoint:** `backend/app/main.py` — app title *RakshaDoc AI Backend*, version `1.0.0`.
All routers are mounted under the prefix **`/api`**.

### API Endpoints

Interactive documentation: **http://localhost:8000/docs** — full contract in [`docs/api.md`](docs/api.md).

#### Auth (`/api/auth`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | `{email, password≥8, full_name}` → `{token, user}` · 409 if exists · role always `user` | — |
| POST | `/api/auth/login` | `{email, password}` → `{token, user}` · 401 invalid | — |
| GET | `/api/auth/me` | Current user profile | Bearer |

#### Documents (`/api/documents`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/documents/upload` | Multipart file upload · extension + size validation · SHA-256 computed · 201 | User |
| POST | `/api/documents/demo-sample?sample_type=certificate` | Generates synthetic demo PNG page · 201 | User |
| GET | `/api/documents` | List owner's documents (newest first) | User |
| GET | `/api/documents/{id}` | Document detail (owner-only, else 404) | User |
| POST | `/api/documents/{id}/process` | Run 9-step pipeline · 202 · creates ProcessingJob | User |
| GET | `/api/documents/{id}/processing` | Job status / progress / steps | User |
| GET | `/api/documents/{id}/analysis` | Analysis summary | User |
| GET | `/api/documents/{id}/ocr` | OCR results per page | User |
| GET | `/api/documents/{id}/detections` | Detected elements (normalized bboxes) | User |
| GET | `/api/documents/{id}/preview?page=1` | PNG page preview | User/`?token=` |
| POST | `/api/documents/{id}/protect` | `{level, method, elements[]}` → apply protection · returns `download_url` | User |
| GET | `/api/documents/{id}/protected-copy?download=1` | Download protected copy (or JSON metadata) | User/`?token=` |
| POST | `/api/documents/{id}/verify` | SHA-256 integrity check → VerificationRecord (`DOC-XXXXXX-XXXX`) | User |
| GET | `/api/documents/{id}/braille?language=` | Braille Grade 1 translation of OCR text | User |
| GET | `/api/documents/{id}/audit` | Audit events for the document | User |
| DELETE | `/api/documents/{id}` | Delete document + cascade children + remove files · 204 | User |

**Protection methods:** `redact` (default, permanent pixel removal) and `blur` (Gaussian).
**Protection levels:** `standard`, `high`. Default target elements: `signature, stamp, seal, qr_code`.

#### Public verification

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/verify/{verification_id}` | Public integrity portal · masked doc id · integrity/risk/availability · legal notice | — |

#### Admin (`role: admin`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/metrics` | Document counts + system metrics (`model_available`, `demo_mode`) |
| GET | `/api/admin/audit-logs` | Latest 100 audit events |

#### Health

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/health` | `{status, demo_mode, version, model_available, uptime_s}` | — |

#### Error shape

```json
{ "detail": "Human-readable message", "code": "ERROR_CODE" }
```

Stack traces are never returned. Unhandled exceptions → `500 INTERNAL_SERVER_ERROR`.

### Auth & Roles

| Role | Capabilities |
|------|--------------|
| `user` | Full pipeline + document history (default on register) |
| `admin` | Everything a user can do + metrics, audit logs |

- Passwords hashed with **bcrypt**; tokens are **JWT HS256** with payload `{sub, role, exp}`.
- Token accepted via `Authorization: Bearer <token>` header **or** `?token=<token>` query parameter.
- Frontend stores token in `localStorage` (`rakshadoc_token`) and user object (`rakshadoc_user`); auto-logout on 401.
- Admin routes protected by `require_admin` → `403 Admin privileges required`.

### Services

| Service file | Responsibility |
|--------------|----------------|
| `services/processing.py` | Orchestrates the 9-step pipeline; updates job progress/steps |
| `services/protection.py` | Pillow protection: redact / blur |
| `services/integrity.py` | SHA-256 (64 KB chunks) + verification-ID generation (`DOC-{hash6}-{uuid4}`) |
| `services/braille.py` | Braille Grade 1: Latin dict, Bharati Devanagari dict, digits (`⠼`), uppercase (`⠠`) |
| `services/demo_generator.py` | Deterministic synthetic page rendering (800×1000) + fixed detection set |
| `services/preprocessing.py` | Autocontrast, contrast ×1.25, sharpness ×1.2 |
| `services/audit.py` | Writes audit-log entries for all sensitive operations |

### Database Schema

8 SQLAlchemy tables (SQLite dev / PostgreSQL prod):

| Table | Key columns |
|-------|-------------|
| `users` | id (UUID PK), email (unique, indexed), hashed_password, full_name, role (`user`/`admin`), created_at |
| `documents` | id PK, owner_id (indexed), original_name, mime_type, size_bytes, page_count, quality_score, status (`uploaded/processing/completed/failed`), sha256_hash, tamper_risk (`LOW/MEDIUM/HIGH`), storage_path, created_at |
| `detections` | id PK, document_id FK CASCADE, page, category, bbox JSON `{x,y,w,h}` (normalized 0..1), confidence, sensitivity, action |
| `ocr_results` | id PK, document_id FK CASCADE, page, language, language_confidence, source (`demo`), text, structured JSON |
| `processing_jobs` | id PK, document_id FK CASCADE, status (`queued/running/completed/failed`), progress, current_step, steps JSON, completed_steps JSON, started_at, completed_at, error |
| `verification_records` | id PK, verification_id (unique, indexed), document_id FK CASCADE, hash_algorithm, document_hash, integrity_status, tamper_risk, sensitive_elements, protected_copy_available, braille_available, created_at |
| `protection_records` | id PK, document_id FK CASCADE, protection_level, method, elements JSON, file_path, created_at |
| `audit_logs` | id PK, user_id nullable, document_id nullable, action, detail, created_at |

### Security Middleware

Applied globally in `main.py`:

- **Security headers:** CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`, `Cache-Control: no-store` on `/api/documents*`
- **CORS:** origins from `CORS_ORIGINS`, credentials allowed, methods `GET/POST/PUT/DELETE/OPTIONS`, headers `Authorization` + `Content-Type`
- **Upload validation:** extension allowlist + MIME + size limit; random internal UUID storage IDs
- **Owner isolation:** document endpoints are owner-only (404 otherwise)

### Backend Dependencies (`backend/requirements.txt`)

```
fastapi>=0.104.0
uvicorn>=0.24.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
email-validator>=2.0.0
bcrypt>=4.0.0
PyJWT>=2.8.0
python-multipart>=0.0.6
opencv-python-headless>=4.8.0
pillow>=10.0.0
numpy>=1.24.0
pymupdf>=1.23.0
pytest>=7.4.0
httpx>=0.25.0
```

---

## Frontend

Next.js **16.3.1** (App Router + Turbopack), React **19.2.8**, TypeScript **5**, Tailwind CSS **4**.

### Landing Page

`app/page.tsx` is a static server component — a modern SaaS-style marketing page:

1. **Hero** — headline with gradient accent, sub-copy, *Get Started* / *Try Demo* CTAs, and an icon-card document illustration.
2. **Trust chips** — SHA-256 integrity · OCR · redaction · Braille output.
3. **Features** — 8 feature cards (layout analysis, sensitive detection, protection, integrity, OCR, Braille, demo mode, audit trail).
4. **How It Works** — 6-step ordered flow.
5. **Security** and **Accessibility** sections.
6. **CTA section** (navy background) + `SiteHeader` / `SiteFooter`.

### Pages & Routes (public)

| Route | Page |
|-------|------|
| `/` | Landing (hero, features, how-it-works, CTA) |
| `/about` | About |
| `/features` | Features |
| `/how-it-works` | How It Works (6 stages) |
| `/security` | Security & Privacy |
| `/accessibility` | Accessibility |
| `/disclaimer` | AI Disclaimer |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/login` | Login (supports `?next=` redirect) |
| `/register` | Register |
| `/verify/[verification_id]` | Public verification portal |
| `error.tsx` / `not-found.tsx` | Global error & 404 pages |

Root layout: title template `%s · RakshaDoc AI`, fonts Inter / Sora / Geist Mono, theme color `#0d2b52`.

### Dashboard

All under `/dashboard/*`, auth-guarded by `DashboardShell` (redirects to `/login?next=...` if unauthenticated).

| Route | Purpose |
|-------|---------|
| `/dashboard` | Overview (stats, recent documents) |
| `/dashboard/analyze` | Document analysis |
| `/dashboard/documents` | Document history / repository (search via `?q=`) |
| `/dashboard/documents/[id]` | Document detail |
| `/dashboard/documents/[id]/processing` | Processing job view |
| `/dashboard/documents/[id]/protect` | Protection wizard (levels, methods) |
| `/dashboard/protection` | Protection Center |
| `/dashboard/verify` | Verification Center |
| `/dashboard/braille` | Accessibility / Braille |
| `/dashboard/profile` | Profile |
| `/dashboard/admin` | Admin console (admin role only): metrics + audit logs |

**Sidebar groups:** Workspace (Dashboard, Analyze Document, My Documents, Protection, Verify, Accessibility) · Account (Profile) · Admin (Admin Console, admin-only). Mobile bottom nav: Dashboard, Analyze, Documents, Verify.

### Components

- **Root:** `site-header`, `site-footer`, `logo`, `ai-disclaimer`, `empty-state`, `error-state`
- **`ui/` (20 shadcn-style):** avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, progress, radio-group, select, separator, sheet, skeleton, switch, table, tabs, textarea, tooltip
- **`dashboard/`:** `dashboard-shell` (auth guard + nav), `processing-view`, `status-badges`, `detection-colors`

### API Client & Hooks

- **`lib/api.ts`** — typed `ApiClient` covering every backend endpoint; base `API_URL = NEXT_PUBLIC_API_URL ?? http://localhost:8000/api`; automatic Bearer injection; `ApiClientError`; localStorage auth helpers; `previewUrl` / `signedUrl` / `protectedCopyUrl` helpers; auto-logout on 401.
- **`hooks/use-auth.ts`** — `useAuth()` with `login` / `register` / `logout` / `refresh`; session bootstrap from `api.me()`.
- **`hooks/use-media-query.ts`** — responsive hooks.
- **`types/index.ts`** — 23 types mirroring backend schemas (User, Document, Detection, OCRResult, ProcessingJob, VerificationRecord, ProtectedCopy, BrailleOutput, AuditEvent, AdminMetrics, HealthResponse, …).

### Frontend Scripts

```bash
npm run dev      # Next.js dev server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

---

## ML Layer

`backend/ml/` is a flat module set (imported by `app/services/*`):

| Module | Key functions | Backed by |
|--------|---------------|-----------|
| `ml/document_detection.py` | `analyze_document_quality`, `detect_document_components` | OpenCV (sharpness, contrast, QR/contour detection) + deterministic demo fallbacks |
| `ml/ocr.py` | `extract_text` | demo stub (empty text, `source: "demo"`) |
| `ml/sensitive_detection.py` | `detect_sensitive_elements`, `SENSITIVE_CATEGORIES`, `DEFAULT_PROTECTION_TARGETS` | layout categories |
| `ml/tamper_detection.py` | `compute_file_hash`, `analyze_tamper_risk` | SHA-256 comparison → LOW/MEDIUM/HIGH |

---

## Core Modules

| Module | What it does |
|--------|--------------|
| Layout analysis | Detects title, headings, paragraphs, tables, figures, lists, signatures, stamps, seals, logos, QR codes |
| Quality analysis | Laplacian sharpness, contrast, brightness, resolution, Canny edge readability → weighted score |
| Sensitive protection | Detects signatures / official stamps / seals / QR codes and protects them in shareable copies |
| Secure redaction | Removes underlying sensitive pixels — **Permanent Redaction** (default) and Blur |
| Integrity verification | SHA-256 hashing — confirms the exact file has not changed since the hash was recorded |
| Tamper-risk analysis | Risk scoring: LOW / MEDIUM / HIGH |
| Multilingual OCR | Language detection + text extraction (currently demo stub, tagged `source: demo`) |
| Braille output | Converts extracted text into Braille Grade 1 Unicode (Latin + Devanagari) / TXT |
| Audit trail | Records upload / process / protect / verify / delete events |
| Public verification | `/verify/[id]` portal with integrity status + legal notice |

---

## Testing

Real test suite lives in **`backend/tests/`** (pytest):

| File | Coverage |
|------|----------|
| `conftest.py` | Temp SQLite DB + temp upload/storage dirs, `ENVIRONMENT=testing`, `SECRET_KEY` set, `DEMO_MODE=true`, `client` + `auth_tokens` fixtures |
| `test_auth.py` | Health shape · register → duplicate 409 → login → bad password 401 → `/me` · guest endpoint removed (404/405/422) |
| `test_documents.py` | Full pipeline (upload → process → analysis → detections → OCR → verify → public verify → protect → braille → delete) · invalid `.exe` upload → 400 |
| `test_braille.py` | Latin `abc` → `⠁⠃⠉` · uppercase contains `⠠` · Devanagari `भारत` non-empty |

```bash
cd backend
.venv\Scripts\activate
pytest
```

Last run: **8 tests collected, 0 failures**.

---

## Scripts & Tooling

| Path | Purpose |
|------|---------|
| `start.py` | Launches backend (uvicorn :8000) + frontend (next dev :3000) together |
| `scripts/test_demo.py` | httpx end-to-end smoke demo against `http://localhost:8000/api` — register, upload, process, detections, OCR, protect, verify, Braille, public verify, audit trail (10 numbered steps) |
| `scripts/deep_test.py` | 105-check deep test suite against the live servers — auth, upload validation, pipeline, protection, tamper detection, Braille, audit, admin/role enforcement, delete cascade, CORS/security headers, frontend routes. Run from `backend/`: `python ../scripts/deep_test.py` |

```bash
python scripts/test_demo.py       # quick 10-step smoke
cd backend && python ../scripts/deep_test.py   # full 105-check suite (servers must be running)
```

---

## Documentation Index

| File | Contents |
|------|----------|
| [`docs/architecture.md`](docs/architecture.md) | System topology + security design decisions |
| [`docs/api.md`](docs/api.md) | Full API contract: objects, endpoint tables, demo-mode contract, download flow |
| [`docs/database.md`](docs/database.md) | 8-table schema summary |
| [`docs/deployment.md`](docs/deployment.md) | Deployment notes (frontend/backend/DB/storage, no Docker) |
| Swagger / OpenAPI | http://localhost:8000/docs (generated) |

---

## Security & Privacy

- Original documents are **never overwritten**; protected copies are separate files.
- Uploads stored in **private storage** (never `public/`, `static/`, `frontend/`, or Git) at randomized UUID paths.
- Extension + MIME validation, size/page limits, signed/authenticated temporary access (`Bearer` or `?token=`).
- JWT auth (HS256, 120 min expiry), bcrypt password hashing, role-based access (user/admin).
- CSP + security headers, locked-down CORS (credentials, explicit origins — never `*`).
- `Cache-Control: no-store` on document API responses.
- Configurable retention (`RETENTION_DAYS`); users can permanently delete documents (cascades + file removal).
- Audit trail for upload / process / protect / verify / delete.
- No reusable signature/stamp assets are intentionally created.
- Demo synthetic pages are watermarked *DEMO DOCUMENT — NOT AN OFFICIAL DOCUMENT*.

---

## Known Limitations

- **Demo Mode is active** (`model_available: false`); AI analysis is simulated until real models are connected in `backend/ml/`.
- **OCR engine not wired** — `ml/ocr.py` returns a demo stub; `pytesseract` is installed but not integrated.
- **No Alembic migrations** — schema managed by `create_all()` only.
- **Retention cleanup worker not implemented** — `RETENTION_DAYS` is configured but there is no background job.
- **`.env` loading** — backend reads `.env` from the **current working directory**; run uvicorn from repo root or copy `.env` into `backend/`.
- **No Docker** — deployment is direct (Uvicorn + Next.js or Vercel); see `docs/deployment.md`.
- Tamper-risk scoring is **probabilistic**, not legal proof of forgery or authenticity.

---

## Disclaimer

RakshaDoc AI provides AI-assisted document analysis, privacy protection and integrity verification.
Tamper-risk results are probabilistic and are **not** legal proof of forgery or authenticity. Official or legal verification should be performed through the relevant authoritative institution.

This tool does **not** reproduce signatures, clone signatures, recreate government stamps, or forge documents.

© 2026 RakshaDoc AI
