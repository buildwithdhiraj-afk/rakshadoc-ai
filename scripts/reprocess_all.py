"""Re-run the processing pipeline for every completed document.

Refreshes legacy docs that were processed before the real-coordinate detection
rewrite: re-renders real pages and replaces fabricated/stale detections.
Run from anywhere; switches into backend/ so app.* and ml.* import correctly.
"""
import os
import sys

BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, BACKEND)
os.chdir(BACKEND)

from app.core.database import SessionLocal  # noqa: E402
from app.models import Detection, Document, ProcessingJob  # noqa: E402
from app.services.processing import STEPS, run_processing_pipeline  # noqa: E402

db = SessionLocal()
docs = db.query(Document).filter(Document.status == "completed").all()
print(f"{len(docs)} completed documents")

fails = 0
for doc in docs:
    job = db.query(ProcessingJob).filter_by(document_id=doc.id).first()
    if not job:
        job = ProcessingJob(
            document_id=doc.id,
            status="queued",
            progress=0.0,
            current_step="Queued",
            steps=STEPS,
            completed_steps=[],
        )
        db.add(job)
        db.commit()
        db.refresh(job)
    try:
        run_processing_pipeline(db, job.id)
        n = db.query(Detection).filter_by(document_id=doc.id).count()
        pages = db.query(Detection).filter_by(document_id=doc.id).distinct(Detection.page)
        page_set = sorted({p.page for p in db.query(Detection).filter_by(document_id=doc.id).all()})
        print(f"  OK  {doc.original_name[:44]:44s} pages={doc.page_count} dets={n} on {page_set} [{job.status}]")
    except Exception as e:
        fails += 1
        print(f"  FAIL {doc.original_name[:44]:44s} {type(e).__name__}: {e}")

db.close()
print(f"done: {len(docs) - fails} ok, {fails} failed")
