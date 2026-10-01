# Deployment Guide — RakshaDoc AI

## Production Overview

- **Frontend**: Next.js App Router deployed to Vercel or Node.js server (`npm run build && npm run start`).
- **Backend**: Python 3.12 FastAPI running with Uvicorn/Gunicorn.
- **Database**: PostgreSQL server. Set `DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/rakshadoc`.
- **Storage**: Persistent S3 / local block storage for private upload & rendering directory.

## Run (no Docker)

```bash
# Backend (port 8000)
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Frontend (port 3000)
cd frontend
npm install
npm run build && npm run start   # production
npm run dev                       # development
```

Or from the project root, `python start.py` starts both processes together.

## Environment

Set `DATABASE_URL`, `UPLOAD_DIR`, `STORAGE_DIR`, `SECRET_KEY`, `ENVIRONMENT=production`, and
`DEMO_MODE=false` in `backend/.env` (or a `.env` next to the working directory).
