# Deployment Guide — RakshaDoc AI

## Production Overview

- **Frontend**: Next.js App Router deployed to Vercel or Node.js server (`npm run build && npm run start`).
- **Backend**: Python 3.9+ FastAPI running with Uvicorn/Gunicorn.
- **Database**: PostgreSQL server. Set `DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/rakshadoc`.
- **Storage**: Persistent S3 / local block storage for private upload & rendering directory.

## Docker Support

A Dockerfile and `docker-compose.yml` can be placed in `docker/` for containerized deployment.
