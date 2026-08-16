# RakshaDoc AI

**Understand. Protect. Verify. Access.**

RakshaDoc AI — Secure and Accessible AI-Powered Document Intelligence for Multilingual Indian Documents.

A document-intelligence platform that combines document layout analysis, computer vision, OCR, sensitive-element detection, signature/stamp protection, privacy-preserving redaction, integrity verification, tamper-risk analysis, multilingual text extraction and Braille accessibility.

> **Important:** RakshaDoc AI is designed to **protect**, **detect**, **verify** and **access** documents.
> It is NOT designed to reproduce signatures, clone signatures, recreate government stamps, forge documents, or claim legal authenticity. Integrity verification confirms file integrity only — it is not a legal certification of authenticity.

---

## Architecture

```
rakshadoc-ai/
├── frontend/   Next.js + TypeScript + Tailwind CSS + shadcn/ui
├── backend/    FastAPI (Python) — modular services, JWT auth, PostgreSQL
├── ml/         Modular ML layer (preprocessing, layout, ocr, sensitive,
│               tamper, redaction, braille, evaluation)
├── models/     Model weights / artifacts (gitignored)
├── data/       Uploads + private storage (gitignored)
├── scripts/    Dev / setup / deploy helpers
├── tests/      Cross-cutting tests
├── docs/       Architecture, API, research documentation
├── docker/     Deployment configs
```

### Stack

| Layer      | Tech |
|------------|------|
| Frontend   | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Lucide icons |
| Backend    | Python, FastAPI, SQLAlchemy, Pydantic |
| Database   | PostgreSQL |
| Auth       | JWT-based secure session |
| AI/ML      | PyTorch, OpenCV, NumPy, Pandas (modular, swappable) |
| OCR        | Modular layer — Tesseract / PaddleOCR / EasyOCR / custom |

---

## Demo Mode

Until real trained models are connected, the backend runs in **Demo Mode** (`DEMO_MODE=true`).
Demo Mode uses clearly-labelled simulated analysis and synthetic documents — it never pretends
that a placeholder is a trained AI model. The UI shows **"Demo Analysis"** (not "AI Verified")
until a real model is wired in. Every service is built behind an interface so a trained model can
replace the demo implementation without changing the API.

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp ../.env.example ../.env    # then edit values
uvicorn app.main:app --reload --port 8000
```

Docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local
npm run dev
```

App: http://localhost:3000

### Database

PostgreSQL with the URL from `.env`. The app creates tables on startup
(`create_all` for development). For production use Alembic migrations.

---

## Core Modules

| Module | What it does |
|--------|--------------|
| Layout analysis | Detects title, headings, paragraphs, tables, figures, lists, signatures, stamps, seals, logos, QR codes |
| Sensitive protection | Detects signatures / official stamps / seals / QR codes and protects them in shareable copies |
| Secure redaction | Removes underlying sensitive pixels (Permanent Redaction default; also Blur, Pixelation, Mask) |
| Integrity verification | SHA-256 hashing — confirms the exact file has not changed since the hash was recorded |
| Tamper-risk analysis | Probabilistic risk scoring: LOW / MEDIUM / HIGH |
| Multilingual OCR | Language detection + text extraction (Hindi, Marathi, English, Tamil, Telugu, etc. — only what the active OCR engine supports) |
| Braille output | Converts extracted text into Braille Unicode / TXT / Braille-ready format |
| Audit trail | Records important document-processing events |

## Security & Privacy

- Original documents are **never overwritten**; protected copies are separate.
- Uploaded documents are stored in **private storage** (never `public/`, `static/`, `frontend/`, or Git).
- Extension + MIME validation, size/page limits, random internal storage IDs, signed temporary access.
- JWT auth, secure cookies, CSP + security headers, locked-down CORS in production.
- Configurable retention; users can permanently delete documents.
- No reusable signature/stamp assets are intentionally created.

## Documentation

See `docs/` for architecture, API contracts, database schema, and research methodology.

## Disclaimer

RakshaDoc AI provides AI-assisted document analysis, privacy protection and integrity verification.
Tamper-risk results are probabilistic and are not legal proof of forgery or authenticity. Official or
legal verification should be performed through the relevant authoritative institution.

© 2026 RakshaDoc AI
