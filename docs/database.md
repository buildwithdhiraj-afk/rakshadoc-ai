# Database Schema — RakshaDoc AI

The system uses SQLAlchemy ORM compatible with SQLite for dev/test and PostgreSQL for production.

## Key Tables

- `users`: ID, email, hashed_password, full_name, role (`guest`, `user`, `admin`), created_at.
- `documents`: ID, owner_id, original_name, mime_type, size_bytes, page_count, quality_score, status, sha256_hash, tamper_risk, storage_path, created_at.
- `detections`: ID, document_id, page, category, bbox (JSON `{x, y, w, h}` normalized 0..1), confidence, sensitivity, action.
- `ocr_results`: ID, document_id, page, language, language_confidence, source, text, structured (JSON).
- `processing_jobs`: ID, document_id, status, progress, current_step, steps (JSON), completed_steps (JSON), started_at, completed_at, error.
- `verification_records`: ID, verification_id (`DOC-XXXXXX`), document_id, hash_algorithm, document_hash, integrity_status, tamper_risk, sensitive_elements, protected_copy_available, braille_available, created_at.
- `protection_records`: ID, document_id, protection_level, method, elements (JSON), file_path, created_at.
- `audit_logs`: ID, user_id, document_id, action, detail, created_at.
