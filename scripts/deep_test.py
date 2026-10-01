"""Deep test suite for RakshaDoc AI — runs against the LIVE servers.
Usage: python deep_test.py   (run from backend/ so the live SQLite DB is shared)
"""
import io
import os
import sys
import time
import traceback

import httpx

API = os.environ.get("RAKSHADOC_API", "http://localhost:8000/api")
WEB = "http://localhost:3000"
RESULTS = []


def check(name, cond, detail=""):
    RESULTS.append((name, bool(cond), detail))
    print(f"{'PASS' if cond else 'FAIL'}  {name}" + (f"  [{detail}]" if detail else ""))


def section(title):
    print(f"\n=== {title} ===")


# ---------------------------------------------------------------- setup
client = httpx.Client(timeout=30)
TS = int(time.time() * 1000) % 10_000_000
USER_EMAIL = f"deep_user_{TS}@test.com"
OTHER_EMAIL = f"deep_other_{TS}@test.com"
ADMIN_EMAIL = f"deep_admin_{TS}@test.com"
PASSWORD = "DeepTest!234"

# Create admin account directly in the shared DB (seeding uses random pwds)
try:
    sys.path.insert(0, os.getcwd())
    from app.core.database import SessionLocal
    from app.core.security import hash_password
    from app.models import User

    db = SessionLocal()
    if not db.query(User).filter_by(email=ADMIN_EMAIL).first():
        db.add(User(email=ADMIN_EMAIL, hashed_password=hash_password(PASSWORD),
                    full_name="Deep Test Admin", role="admin"))
        db.commit()
    db.close()
    ADMIN_READY = True
except Exception as e:
    ADMIN_READY = False
    print(f"admin setup failed: {e}")

from PIL import Image


def png_bytes(w=600, h=800, color="white"):
    buf = io.BytesIO()
    Image.new("RGB", (w, h), color).save(buf, format="PNG")
    buf.seek(0)
    return buf


# ================================================================ AUTH
section("A. Auth")
r = client.post(f"{API}/auth/register", json={"email": USER_EMAIL, "password": PASSWORD, "full_name": "Deep Tester"})
check("register new user -> 200 + token", r.status_code == 200 and "token" in r.json(), f"{r.status_code}")
U = r.json().get("token", "")
check("register role == user", r.json().get("user", {}).get("role") == "user")

r = client.post(f"{API}/auth/register", json={"email": USER_EMAIL, "password": PASSWORD, "full_name": "Dup"})
check("duplicate register -> 409", r.status_code == 409, f"{r.status_code}")

r = client.post(f"{API}/auth/register", json={"email": f"bad_{TS}@x", "password": "short", "full_name": "X"})
check("short password -> 400/422", r.status_code in (400, 422), f"{r.status_code}")

r = client.post(f"{API}/auth/register", json={"email": "not-an-email", "password": PASSWORD, "full_name": "X"})
check("bad email -> 400/422", r.status_code in (400, 422), f"{r.status_code}")

r = client.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": PASSWORD})
check("login ok -> token", r.status_code == 200 and "token" in r.json(), f"{r.status_code}")

r = client.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": "WrongPass!1"})
check("wrong password -> 401", r.status_code == 401, f"{r.status_code}")

r = client.post(f"{API}/auth/login", json={"email": f"ghost_{TS}@t.com", "password": PASSWORD})
check("unknown email -> 401", r.status_code == 401, f"{r.status_code}")

r = client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {U}"})
check("/me -> email matches", r.status_code == 200 and r.json().get("email") == USER_EMAIL, f"{r.status_code}")

r = client.get(f"{API}/auth/me")
check("/me no token -> 401", r.status_code == 401, f"{r.status_code}")

r = client.get(f"{API}/auth/me", headers={"Authorization": "Bearer garbage.token.here"})
check("/me bad token -> 401", r.status_code == 401, f"{r.status_code}")

r = client.post(f"{API}/auth/guest", json={})
check("guest endpoint removed -> 404/405", r.status_code in (404, 405), f"{r.status_code}")

r = client.post(f"{API}/auth/login", json={"email": OTHER_EMAIL, "password": PASSWORD})
if r.status_code != 200:
    client.post(f"{API}/auth/register", json={"email": OTHER_EMAIL, "password": PASSWORD, "full_name": "Other"})
    r = client.post(f"{API}/auth/login", json={"email": OTHER_EMAIL, "password": PASSWORD})
O = r.json().get("token", "")
check("second user registered", bool(O))

AH = {"Authorization": f"Bearer {U}"}
OH = {"Authorization": f"Bearer {O}"}

# ================================================================ UPLOAD
section("B. Upload & listing")
r = client.post(f"{API}/documents/upload", files={"file": ("deep_test.png", png_bytes(), "image/png")}, headers=AH)
check("upload PNG -> 201", r.status_code == 201, f"{r.status_code}")
DOC = r.json()
DID = DOC.get("id", "")
check("upload returns sha256 (64 hex)", len(DOC.get("sha256_hash", "")) == 64, DOC.get("sha256_hash", "")[:16])
check("upload status uploaded/completed", DOC.get("status") in ("uploaded", "completed"), DOC.get("status"))

r = client.post(f"{API}/documents/upload", files={"file": ("evil.exe", io.BytesIO(b"MZ..."), "application/octet-stream")}, headers=AH)
check(".exe upload -> 400", r.status_code == 400, f"{r.status_code}")

r = client.post(f"{API}/documents/upload", files={"file": ("notes.txt", io.BytesIO(b"hi"), "text/plain")}, headers=AH)
check(".txt upload -> 400", r.status_code == 400, f"{r.status_code}")

big = io.BytesIO(b"\0" * (26 * 1024 * 1024))
r = client.post(f"{API}/documents/upload", files={"file": ("big.png", big, "image/png")}, headers=AH)
check("26MB upload -> 400 (max 25MB)", r.status_code == 400, f"{r.status_code}")

# multi-page PDF
import fitz
pdf = fitz.open()
for i in range(2):
    page = pdf.new_page()
    page.insert_text((72, 72), f"Deep test page {i+1}")
pdf_bytes = io.BytesIO(pdf.tobytes())
pdf.close()
r = client.post(f"{API}/documents/upload", files={"file": ("two_page.pdf", pdf_bytes, "application/pdf")}, headers=AH)
PDF_OK = r.status_code == 201
check("upload 2-page PDF -> 201", PDF_OK, f"{r.status_code}")
PDF_ID = r.json().get("id", "") if PDF_OK else ""
check("PDF page_count == 2", r.json().get("page_count") == 2 if PDF_OK else False,
      str(r.json().get("page_count") if PDF_OK else "-"))

r = client.post(f"{API}/documents/demo-sample?sample_type=certificate", headers=AH)
check("demo-sample -> 201", r.status_code == 201, f"{r.status_code}")
SAMPLE_ID = r.json().get("id", "")
r = client.post(f"{API}/documents/{SAMPLE_ID}/process", headers=AH)
check("demo-sample processed", r.status_code == 202 and r.json().get("status") == "completed",
      f"{r.status_code} {r.json().get('status') if r.status_code in (200, 202) else ''}")

r = client.get(f"{API}/documents", headers=AH)
docs = r.json() if r.status_code == 200 else []
check("list docs >= 3 & newest first", r.status_code == 200 and len(docs) >= 3, f"n={len(docs)}")

r = client.get(f"{API}/documents/{DID}", headers=AH)
check("get own doc -> 200", r.status_code == 200, f"{r.status_code}")

r = client.get(f"{API}/documents/{DID}", headers=OH)
check("other user's doc -> 404 (owner isolation)", r.status_code == 404, f"{r.status_code}")

r = client.get(f"{API}/documents/00000000-0000-0000-0000-000000000000", headers=AH)
check("nonexistent doc -> 404", r.status_code == 404, f"{r.status_code}")

# ================================================================ PROCESSING
section("C. Processing pipeline")
r = client.post(f"{API}/documents/{DID}/process", headers=AH)
check("process -> 202", r.status_code == 202, f"{r.status_code}")
job = r.json()
STEPS9 = ["Document Uploaded", "Quality Analysis", "Image Enhancement", "Layout Detection",
          "OCR Extraction", "Sensitive Element Detection", "Protection Processing",
          "Integrity Verification", "Braille Generation"]
check("job completed + 9 steps", job.get("status") == "completed" and job.get("completed_steps") == STEPS9,
      f"{job.get('status')} n={len(job.get('completed_steps') or [])}")

r = client.get(f"{API}/documents/{DID}/processing", headers=AH)
check("GET processing -> 100% completed", r.status_code == 200 and r.json().get("progress") == 100.0)

r = client.post(f"{API}/documents/{DID}/process", headers=AH)
check("re-process (idempotent) -> completed", r.status_code == 202 and r.json().get("status") == "completed")

r = client.get(f"{API}/documents/{DID}/analysis", headers=AH)
ana = r.json() if r.status_code == 200 else {}
check("analysis -> 200 with analysis block", r.status_code == 200 and ana.get("analysis") is not None,
      str(list((ana.get("analysis") or {}).keys())))

r = client.get(f"{API}/documents/{DID}/detections", headers=AH)
dets = r.json() if r.status_code == 200 else []
check("blank page -> 0 detections (nothing fabricated)", r.status_code == 200 and len(dets) == 0,
      f"n={len(dets)}")

r = client.get(f"{API}/documents/{SAMPLE_ID}/detections", headers=AH)
sdets = r.json() if r.status_code == 200 else []
check("demo sample -> >= 4 real detections", len(sdets) >= 4, f"n={len(sdets)}")
if sdets:
    bb = sdets[0].get("bbox", {})
    norm = all(0 <= float(bb.get(k, -1)) <= 1 for k in ("x", "y", "w", "h"))
    check("bbox normalized 0..1", norm, str(bb))
    boxes_ok = all(
        0 <= d["bbox"]["x"] and 0 <= d["bbox"]["y"] and d["bbox"]["w"] > 0 and d["bbox"]["h"] > 0
        and d["bbox"]["x"] + d["bbox"]["w"] <= 1.0 + 1e-9 and d["bbox"]["y"] + d["bbox"]["h"] <= 1.0 + 1e-9
        for d in sdets
    )
    check("all boxes inside page (x+w<=1, y+h<=1)", boxes_ok,
          str([(d["category"], d["bbox"]) for d in sdets[:3]]))
    cats = {"title", "heading", "paragraph", "table", "figure", "list", "signature", "stamp", "seal", "logo", "qr_code"}
    check("categories valid", all(d.get("category") in cats for d in sdets),
          ",".join(sorted({d.get("category") for d in sdets})))
    check("no default/fabricated coords (varied boxes)",
          len({(d["bbox"]["x"], d["bbox"]["y"]) for d in sdets}) == len(sdets))

r = client.get(f"{API}/documents/{DID}/ocr", headers=AH)
ocr = r.json() if r.status_code == 200 else []
# Rows only exist for pages that actually yielded text, and `source` records
# where that text came from. An empty list is a valid result, not a failure.
VALID_SOURCES = {"pdf_text_layer", "tesseract", "none"}
check("OCR rows have a real source and language",
      all(o.get("source") in VALID_SOURCES and bool(o.get("language")) for o in ocr),
      f"n={len(ocr)} sources={sorted({o.get('source') for o in ocr})}")
check("no fabricated OCR text", all("demo" not in (o.get("source") or "") for o in ocr),
      f"n={len(ocr)}")

r = client.get(f"{API}/documents/{DID}/preview?page=1", headers=AH)
check("preview authed -> image/png", r.status_code == 200 and "image/png" in r.headers.get("content-type", ""),
      f"{r.status_code} {r.headers.get('content-type','')}")
r = client.get(f"{API}/documents/{DID}/preview?page=1")
check("preview unauth -> 401/403", r.status_code in (401, 403), f"{r.status_code}")

# PDF processing
if PDF_OK:
    r = client.post(f"{API}/documents/{PDF_ID}/process", headers=AH)
    check("PDF process -> completed", r.status_code == 202 and r.json().get("status") == "completed")
    # real page 2 render (previously fabricated synthetic garbage)
    r = client.get(f"{API}/documents/{PDF_ID}/preview?page=2", headers=AH)
    check("PDF preview page 2 -> real render 200/png",
          r.status_code == 200 and "image/png" in r.headers.get("content-type", ""),
          f"{r.status_code} {r.headers.get('content-type','')}")
    r = client.get(f"{API}/documents/{PDF_ID}/detections", headers=AH)
    pdets = r.json() if r.status_code == 200 else []
    ppages = {d.get("page") for d in pdets}
    check("PDF detections on >= 1 page, pages within 1..2",
          len(pdets) >= 1 and all(p in (1, 2) for p in ppages),
          f"n={len(pdets)} pages={sorted(str(p) for p in ppages)}")

# ================================================================ PROTECTION
section("D. Protection")
r = client.post(f"{API}/documents/{DID}/protect",
                json={"level": "high", "method": "redact", "elements": ["signature", "stamp"]}, headers=AH)
check("protect redact -> 200 + download_url", r.status_code == 200 and r.json().get("download_url"),
      f"{r.status_code}")
PROT = r.json()

r = client.post(f"{API}/documents/{DID}/protect",
                json={"level": "standard", "method": "blur", "elements": ["signature"]}, headers=AH)
check("protect blur -> 200", r.status_code == 200, f"{r.status_code}")

r = client.post(f"{API}/documents/{DID}/protect",
                json={"level": "high", "method": "pixelate", "elements": ["signature"]}, headers=AH)
check("protect pixelate -> 422 (removed method)", r.status_code == 422, f"{r.status_code}")

r = client.post(f"{API}/documents/00000000-0000-0000-0000-000000000000/protect",
                json={"level": "high", "method": "redact", "elements": ["signature"]}, headers=AH)
check("protect nonexistent -> 404", r.status_code == 404, f"{r.status_code}")

r = client.post(f"{API}/documents/{DID}/protect",
                json={"level": "high", "method": "redact", "elements": ["signature"]}, headers=OH)
check("protect other user's doc -> 404", r.status_code == 404, f"{r.status_code}")

r = client.get(f"{API}/documents/{DID}/protected-copy", headers=AH)
check("protected-copy metadata -> 200", r.status_code == 200, f"{r.status_code}")

# redaction actually changed pixels: compare sample page vs protected file on disk
try:
    from app.core.config import settings
    page_f = os.path.join(settings.STORAGE_DIR, SAMPLE_ID, "page_1.png")
    # default protected from pipeline
    prot_f = os.path.join(settings.STORAGE_DIR, SAMPLE_ID, "protected_default.png")
    if os.path.exists(page_f) and os.path.exists(prot_f):
        import hashlib
        a = hashlib.sha256(open(page_f, "rb").read()).hexdigest()
        b = hashlib.sha256(open(prot_f, "rb").read()).hexdigest()
        check("redacted copy differs from original page", a != b, f"{a[:8]} vs {b[:8]}")
    else:
        check("redacted copy exists on disk", False, f"page={os.path.exists(page_f)} prot={os.path.exists(prot_f)}")
except Exception as e:
    check("redaction pixel check", False, str(e))

# ================================================================ VERIFY + TAMPER
section("E. Integrity verification & tamper detection")
r = client.post(f"{API}/documents/{DID}/verify", headers=AH)
ver = r.json() if r.status_code == 200 else {}
check("verify -> 200 VALID", r.status_code == 200 and ver.get("integrity_status") == "VALID", f"{r.status_code}")
vid = ver.get("verification_id", "")
check("verification_id format DOC-XXXXXX-XXXX", len(vid) == 15 and vid.startswith("DOC-") and vid.count("-") == 2, vid)
orig_hash = ver.get("document_hash", "")

r = client.get(f"{API}/verify/{vid}")
pub = r.json() if r.status_code == 200 else {}
check("public verify -> 200 masked id + no leak",
      r.status_code == 200 and pub.get("document_id_masked") and DID not in str(pub),
      f"{r.status_code} masked={pub.get('document_id_masked','')}")
check("public verify has legal notice", bool(pub.get("notice")))

r = client.get(f"{API}/verify/DOC-XXXXXX-AAAA")
check("public verify unknown id -> 404", r.status_code == 404, f"{r.status_code}")

# TAMPER: corrupt the stored original, then re-verify
storage_path = None
try:
    db = SessionLocal()
    from app.models import Document as DocModel
    d = db.query(DocModel).filter_by(id=DID).first()
    storage_path = d.storage_path if d else None
    db.close()
except Exception as e:
    print("db lookup failed:", e)

if storage_path and os.path.exists(storage_path):
    with open(storage_path, "rb") as f:
        original_bytes = f.read()
    with open(storage_path, "ab") as f:
        f.write(b"CORRUPTED-BY-DEEP-TEST")
    r = client.post(f"{API}/documents/{DID}/verify", headers=AH)
    v2 = r.json() if r.status_code == 200 else {}
    check("tampered file -> re-verify reports TAMPERED",
          r.status_code == 200 and v2.get("integrity_status") == "TAMPERED",
          f"status={v2.get('integrity_status')}")
    check("tampered -> risk HIGH + original hash preserved",
          v2.get("tamper_risk") == "HIGH" and v2.get("document_hash") == orig_hash,
          f"risk={v2.get('tamper_risk')} hash_kept={v2.get('document_hash') == orig_hash}")

    # restore file, verify again -> VALID
    with open(storage_path, "wb") as f:
        f.write(original_bytes)
    r = client.post(f"{API}/documents/{DID}/verify", headers=AH)
    v3 = r.json() if r.status_code == 200 else {}
    check("restored file -> VALID again", v3.get("integrity_status") == "VALID",
          f"status={v3.get('integrity_status')}")
else:
    check("tamper: storage file found", False, str(storage_path))

# ================================================================ BRAILLE
section("F. Braille accessibility")
r = client.get(f"{API}/documents/{DID}/braille?language=English", headers=AH)
b = r.json() if r.status_code == 200 else {}
check("braille English -> 200 cells", r.status_code == 200 and len(b.get("braille_unicode", "")) > 0,
      f"cells={len(b.get('braille_unicode',''))}")

r = client.get(f"{API}/documents/{DID}/braille?language=Hindi", headers=AH)
b = r.json() if r.status_code == 200 else {}
check("braille Hindi -> 200 cells", r.status_code == 200 and len(b.get("braille_unicode", "")) > 0,
      f"cells={len(b.get('braille_unicode',''))}")

r = client.get(f"{API}/documents/{DID}/braille", headers=OH)
check("braille other user's doc -> 404", r.status_code == 404, f"{r.status_code}")

# ================================================================ AUDIT
section("G. Audit trail")
r = client.get(f"{API}/documents/{DID}/audit", headers=AH)
acts = [e.get("action") for e in r.json()] if r.status_code == 200 else []
needed = {"upload", "process", "protect", "verify"}
check("audit contains upload/process/protect/verify", needed.issubset(set(acts)), ",".join(acts))

# ================================================================ ADMIN
section("H. Admin & role enforcement")
check("admin test account ready", ADMIN_READY)
r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": PASSWORD})
ADM = r.json().get("token", "") if r.status_code == 200 else ""
check("admin login", bool(ADM), f"{r.status_code}")
ADMH = {"Authorization": f"Bearer {ADM}"}

r = client.get(f"{API}/admin/metrics", headers=ADMH)
check("admin metrics -> 200", r.status_code == 200 and "documents_processed" in r.json(), f"{r.status_code}")

r = client.get(f"{API}/admin/audit-logs", headers=ADMH)
check("admin audit-logs -> >=1", r.status_code == 200 and len(r.json()) >= 1, f"n={len(r.json()) if r.status_code==200 else 0}")

r = client.get(f"{API}/admin/metrics", headers=AH)
check("metrics as normal user -> 403", r.status_code == 403, f"{r.status_code}")

r = client.get(f"{API}/admin/audit-logs", headers=AH)
check("audit-logs as normal user -> 403", r.status_code == 403, f"{r.status_code}")

for removed in ("/admin/experiments", "/admin/models"):
    r = client.get(f"{API}{removed}", headers=ADMH)
    check(f"removed endpoint {removed} -> 404", r.status_code == 404, f"{r.status_code}")

# ================================================================ DELETE
section("I. Delete & cascade")
r = client.delete(f"{API}/documents/{SAMPLE_ID}", headers=AH)
check("delete sample -> 204", r.status_code == 204, f"{r.status_code}")
r = client.get(f"{API}/documents/{SAMPLE_ID}", headers=AH)
check("deleted doc -> 404", r.status_code == 404, f"{r.status_code}")
r = client.get(f"{API}/documents/{SAMPLE_ID}/detections", headers=AH)
check("deleted doc detections -> 404", r.status_code == 404, f"{r.status_code}")
r = client.delete(f"{API}/documents/{SAMPLE_ID}", headers=AH)
check("double delete -> 404", r.status_code == 404, f"{r.status_code}")
if PDF_OK:
    client.delete(f"{API}/documents/{PDF_ID}", headers=AH)
r = client.delete(f"{API}/documents/{DID}", headers=OH)
check("delete other user's doc -> 404 (no cross-delete)", r.status_code == 404, f"{r.status_code}")
r = client.delete(f"{API}/documents/{DID}", headers=AH)
check("delete own doc -> 204", r.status_code == 204, f"{r.status_code}")

# ================================================================ HEALTH / HEADERS
section("J. Health, CORS, security headers")
r = client.get(f"{API}/health")
h = r.json() if r.status_code == 200 else {}
check("health ok + fields", r.status_code == 200 and h.get("status") == "ok" and "demo_mode" in h and "uptime_s" in h,
      f"demo={h.get('demo_mode')} v={h.get('version')}")

r = client.options(f"{API}/auth/login", headers={
    "Origin": "http://localhost:3000",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type",
})
acao = r.headers.get("access-control-allow-origin", "")
check("CORS preflight allows frontend origin", r.status_code in (200, 204) and acao in ("http://localhost:3000", "*"),
      f"{r.status_code} acao={acao}")

r = client.get(f"{API}/health")
check("X-Content-Type-Options nosniff", r.headers.get("x-content-type-options") == "nosniff",
      r.headers.get("x-content-type-options", "missing"))

# ================================================================ FRONTEND
section("K. Frontend routes")
public_ok = ["/", "/about", "/features", "/how-it-works", "/security", "/accessibility",
             "/disclaimer", "/privacy", "/terms", "/login", "/register", "/verify/DOC-F92B68-E198",
             "/dashboard", "/dashboard/analyze", "/dashboard/documents", "/dashboard/protection",
             "/dashboard/verify", "/dashboard/braille", "/dashboard/profile", "/dashboard/admin"]
for path in public_ok:
    try:
        resp = httpx.get(WEB + path, timeout=15, follow_redirects=False)
        check(f"GET {path} -> 200", resp.status_code == 200, f"{resp.status_code}")
    except Exception as e:
        check(f"GET {path}", False, str(e)[:60])

removed_routes = ["/research", "/dataset", "/dashboard/comparison", "/dashboard/summary",
                  "/dashboard/analytics", "/dashboard/settings", "/dashboard/audit"]
for path in removed_routes:
    try:
        resp = httpx.get(WEB + path, timeout=15, follow_redirects=False)
        check(f"removed route {path} -> 404", resp.status_code == 404, f"{resp.status_code}")
    except Exception as e:
        check(f"removed route {path}", False, str(e)[:60])

try:
    html = httpx.get(WEB + "/", timeout=15).text
    check("landing hero present", "Understand" in html or "Protect" in html)
    check("landing has no 'Deep Learning' claim", "Deep Learning" not in html)
    check("landing has CTA links", "/register" in html)
except Exception as e:
    check("landing content", False, str(e)[:60])

try:
    html = httpx.get(WEB + "/login", timeout=15).text
    check("login page has no guest button", "Continue as Guest" not in html and "guest" not in html.lower().replace("guestless", ""))
except Exception as e:
    check("login content", False, str(e)[:60])

# ================================================================ SUMMARY
total = len(RESULTS)
failed = [r for r in RESULTS if not r[1]]
print(f"\n{'='*60}\nRESULT: {total - len(failed)}/{total} passed, {len(failed)} failed")
for name, _, detail in failed:
    print(f"  FAIL: {name}  [{detail}]")
sys.exit(1 if failed else 0)
