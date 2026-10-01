"""Per-page protection and per-page text extraction.

Covers the two behaviours that used to be page-1-only:
- protected copies are generated and served per page, and a download is a
  multi-page PDF,
- OCR results come from the real text layer of every page rather than a
  simulated page-1 result.
"""
import io
import os

import fitz
import pytest
from PIL import Image

import ml.ocr as ocr_mod

from app.services.protection import build_protected_pdf, page_detections
from ml.ocr import detect_language, extract_text


def make_pdf(pages: int = 2, text: str = "RakshaDoc test page {n} content") -> bytes:
    """Build an in-memory text PDF so the text layer is real and readable."""
    doc = fitz.open()
    for n in range(1, pages + 1):
        page = doc.new_page()
        page.insert_text((72, 100), text.format(n=n), fontsize=14)
    out = doc.tobytes()
    doc.close()
    return out


def upload(client, headers, name, payload, content_type):
    r = client.post(
        "/api/documents/upload",
        files={"file": (name, io.BytesIO(payload), content_type)},
        headers=headers,
    )
    assert r.status_code == 201, r.text
    return r.json()


def process(client, headers, doc_id):
    r = client.post(f"/api/documents/{doc_id}/process", headers=headers)
    assert r.status_code in (200, 202), r.text


@pytest.fixture
def pdf_doc(client, auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['user']}"}
    doc = upload(client, headers, "two_page.pdf", make_pdf(2), "application/pdf")
    process(client, headers, doc["id"])
    return headers, doc


def test_uploaded_document_is_not_flagged_as_demo(client, pdf_doc):
    """A real upload must not be labelled a demo sample in the UI."""
    headers, doc = pdf_doc
    assert doc["demo"] is False

    r = client.get(f"/api/documents/{doc['id']}", headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["demo"] is False

    r_list = client.get("/api/documents", headers=headers)
    assert all(d["demo"] is False for d in r_list.json())


def test_insights_derive_entities_from_extracted_text(client, pdf_doc):
    headers, doc = pdf_doc
    r = client.get(f"/api/documents/{doc['id']}/insights", headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["text_source"] == "pdf_text_layer"
    assert body["pages_with_text"] == 2
    # Every entity must be a literal substring of that page's extracted text.
    ocr = client.get(f"/api/documents/{doc['id']}/ocr", headers=headers).json()
    by_page = {o["page"]: o["text"] for o in ocr}
    for ent in body["entities"]:
        assert ent["value"] in by_page[ent["page"]]
    assert "Rahul Sharma" not in by_page[1]


def test_protected_copy_is_page_aware(client, pdf_doc):
    headers, doc = pdf_doc
    doc_id = doc["id"]

    r_prot = client.post(
        f"/api/documents/{doc_id}/protect",
        json={"level": "high", "method": "redact", "elements": ["signature"]},
        headers=headers,
    )
    assert r_prot.status_code == 200, r_prot.text

    images = {}
    for page in (1, 2):
        r = client.get(
            f"/api/documents/{doc_id}/protected-copy?page={page}", headers=headers
        )
        assert r.status_code == 200, r.text
        assert r.headers["content-type"] == "image/png"
        images[page] = r.content

    # Page 1 and page 2 are genuinely different renderings, not the same file
    # served twice.
    assert len(images[1]) > 0
    assert images[1] != images[2]

    with Image.open(io.BytesIO(images[2])) as img:
        assert img.size[0] == 1200


def test_protected_copy_rejects_page_out_of_range(client, pdf_doc):
    headers, doc = pdf_doc
    r = client.get(
        f"/api/documents/{doc['id']}/protected-copy?page=99", headers=headers
    )
    assert r.status_code == 404


def test_protected_copy_download_is_multi_page_pdf(client, pdf_doc):
    headers, doc = pdf_doc
    r = client.get(
        f"/api/documents/{doc['id']}/protected-copy?download=1", headers=headers
    )
    assert r.status_code == 200, r.text
    assert r.headers["content-type"] == "application/pdf"
    with fitz.open(stream=r.content, filetype="pdf") as pdf:
        assert pdf.page_count == 2


def test_protect_applies_new_settings_on_reprotect(client, pdf_doc):
    from app.core.database import SessionLocal
    from app.models import ProtectionRecord

    headers, doc = pdf_doc
    doc_id = doc["id"]

    def latest_page1():
        db = SessionLocal()
        try:
            return (
                db.query(ProtectionRecord)
                .filter_by(document_id=doc_id, page=1)
                .order_by(ProtectionRecord.created_at.desc())
                .first()
            )
        finally:
            db.close()

    payload = {"level": "high", "method": "redact", "elements": ["signature", "stamp"]}
    assert client.post(
        f"/api/documents/{doc_id}/protect", json=payload, headers=headers
    ).status_code == 200
    first = latest_page1()
    assert first.method == "redact"

    payload["method"] = "blur"
    assert client.post(
        f"/api/documents/{doc_id}/protect", json=payload, headers=headers
    ).status_code == 200
    second = latest_page1()

    # Re-protecting must re-render under the new settings, not serve the stale
    # page-1 record from the previous run.
    assert second.method == "blur"
    assert second.id != first.id
    assert second.file_path != first.file_path


def test_protection_records_are_stored_per_page(client, pdf_doc):
    from app.core.database import SessionLocal
    from app.models import ProtectionRecord

    headers, doc = pdf_doc
    client.post(
        f"/api/documents/{doc['id']}/protect",
        json={"level": "high", "method": "redact", "elements": ["signature"]},
        headers=headers,
    )
    db = SessionLocal()
    try:
        pages = sorted({r.page for r in db.query(ProtectionRecord)
                        .filter_by(document_id=doc["id"]).all()})
    finally:
        db.close()
    assert pages == [1, 2]


def test_page_detections_filters_by_page():
    dets = [
        {"page": 1, "category": "signature"},
        {"page": 2, "category": "signature"},
        {"category": "logo"},
    ]
    # A page-less detection is applied to whatever page is being rendered.
    assert [d.get("page") for d in page_detections(dets, 2)] == [2, None]
    assert [d.get("page") for d in page_detections(dets, 1)] == [1, None]
    assert page_detections(dets[:2], 3) == []


def test_build_protected_pdf_requires_pages():
    with pytest.raises(ValueError):
        build_protected_pdf([], "out.pdf")


def test_ocr_reads_real_text_layer_for_every_page(client, pdf_doc):
    headers, doc = pdf_doc
    r = client.get(f"/api/documents/{doc['id']}/ocr", headers=headers)
    assert r.status_code == 200, r.text
    results = r.json()
    assert {o["page"] for o in results} == {1, 2}
    for o in results:
        assert o["source"] == "pdf_text_layer"
        assert f"page {o['page']}" in o["text"].lower()
        assert o["structured"]["paragraphs"]


def test_braille_uses_extracted_text_not_placeholder(client, pdf_doc):
    headers, doc = pdf_doc
    r = client.get(f"/api/documents/{doc['id']}/braille?language=English", headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "RAKSHADOC AI DEMO CONTENT" not in body["extracted_text"]
    assert "test page" in body["extracted_text"].lower()
    assert body["source"] == "pdf_text_layer"


def test_extract_text_prefers_text_layer_over_image(tmp_path):
    pdf_path = tmp_path / "src.pdf"
    pdf_path.write_bytes(make_pdf(1, "Real born digital content"))
    img_path = tmp_path / "page.png"
    Image.new("RGB", (100, 40), "white").save(img_path)

    out = extract_text(str(img_path), pdf_path=str(pdf_path), page_no=1)
    assert out["source"] == "pdf_text_layer"
    assert "Real born digital content" in out["text"]


def test_extract_text_without_engine_reports_none(tmp_path):
    img_path = tmp_path / "blank.png"
    Image.new("RGB", (200, 80), "white").save(img_path)

    out = extract_text(str(img_path), language="English", page_no=1)
    # No text layer and (in CI) no Tesseract binary: report nothing rather than
    # inventing a result.
    assert out["source"] in ("none", "tesseract")
    if out["source"] == "none":
        assert out["text"] == ""
        assert out["structured"]["paragraphs"] == []


def test_tesseract_result_is_used_when_engine_is_present(tmp_path, monkeypatch):
    """Regression: an available Tesseract must actually be used.

    `_tesseract_cmd` used to return the object from
    `pytesseract.get_tesseract_version()` (a `Version`), which was then compared
    to the int `0`. That raised `TypeError`, and the bare `except` turned it into
    a silent `None` - so OCR reported "no text" even with Tesseract installed.
    """
    pytesseract = pytest.importorskip("pytesseract")

    img_path = tmp_path / "scan.png"
    Image.new("RGB", (120, 60), "white").save(img_path)

    monkeypatch.setattr(ocr_mod, "_tesseract_cmd", lambda: "/fake/tesseract")
    monkeypatch.setattr(pytesseract, "get_languages", lambda *a, **k: ["eng", "osd"])
    monkeypatch.setattr(
        pytesseract, "image_to_string", lambda *a, **k: "SCANNED NAME SAMPLE"
    )

    out = ocr_mod.extract_text(str(img_path), language="English", page_no=1)
    assert out["source"] == "tesseract"
    assert "SCANNED NAME SAMPLE" in out["text"]


def test_tesseract_cmd_never_returns_a_comparison_object(monkeypatch):
    """The resolver returns a path (or None), never a `Version` to compare."""
    pytest.importorskip("pytesseract")
    monkeypatch.setattr(ocr_mod, "_tesseract_state", {}, raising=False)

    value = ocr_mod._tesseract_cmd()
    assert value is None or isinstance(value, str), (
        f"expected a path or None, got {type(value).__name__}"
    )


def test_detect_language_by_script():
    hindi, hi_conf = detect_language("नाम राहुल शर्मा")
    assert hindi == "Hindi"
    assert hi_conf > 0.5
    english, en_conf = detect_language("Name Rahul Sharma")
    assert english == "English"
    assert en_conf > 0.5


def test_devanagari_languages_are_available_without_admin_rights():
    """Hindi/Marathi traineddata must resolve from the repo copy.

    Regression: Devanagari packs could only be installed into
    `C:\\Program Files\\Tesseract-OCR\\tessdata`, which needs admin rights. The
    backend ships its own traineddata and exports TESSDATA_PREFIX, so the
    non-Latin languages are usable without touching the system install.
    """
    if not os.path.isdir(ocr_mod._LOCAL_TESSDATA):
        pytest.skip("no local tessdata directory in this checkout")
    assert ocr_mod._tessdata_dir()
    available = ocr_mod._available_languages()
    assert {"eng", "hin", "mar"} <= available


def test_tessdata_prefix_is_exported_before_tesseract_runs(tmp_path, monkeypatch):
    """TESSDATA_PREFIX must be set, or Tesseract ignores the local traineddata."""
    if not os.path.isdir(ocr_mod._LOCAL_TESSDATA):
        pytest.skip("no local tessdata directory in this checkout")
    monkeypatch.delenv("TESSDATA_PREFIX", raising=False)
    monkeypatch.setattr(ocr_mod, "_tesseract_cmd", lambda: "/fake/tesseract")

    pytest.importorskip("pytesseract")
    img_path = os.path.join(str(tmp_path), "probe.png")
    Image.new("RGB", (200, 60), "white").save(img_path)

    monkeypatch.delenv("TESSDATA_PREFIX", raising=False)
    monkeypatch.setattr(ocr_mod, "_tesseract_cmd", lambda: "/fake/tesseract")
    monkeypatch.setattr(ocr_mod, "_available_languages", lambda: {"eng", "hin", "mar"})

    seen = {}
    pytesseract = pytest.importorskip("pytesseract")
    monkeypatch.setattr(
        pytesseract,
        "image_to_string",
        lambda *a, **k: (
            seen.update(
                env=os.environ.get("TESSDATA_PREFIX"), lang=k.get("lang")
            )
            or "SCANNED NAME SAMPLE"
        ),
    )

    out = ocr_mod.extract_text(img_path, language="Hindi", page_no=1)
    assert out["source"] == "tesseract"
    assert seen["lang"] == "hin+eng"
    assert seen["env"] == ocr_mod._tessdata_dir()


def test_missing_language_falls_back_to_english(tmp_path, monkeypatch):
    """A language with no traineddata must not fail the whole page."""
    pytest.importorskip("pytesseract")
    img_path = tmp_path / "scan2.png"
    Image.new("RGB", (80, 40), "white").save(img_path)

    used = {}
    monkeypatch.setattr(ocr_mod, "_tesseract_cmd", lambda: "/fake/tesseract")
    monkeypatch.setattr(ocr_mod, "_available_languages", lambda: {"eng"})
    pytesseract = pytest.importorskip("pytesseract")
    monkeypatch.setattr(
        pytesseract,
        "image_to_string",
        lambda *a, **k: (used.update(lang=k.get("lang")) or "FALLBACK NAME SAMPLE"),
    )

    out = ocr_mod.extract_text(str(img_path), language="Hindi", page_no=1)
    assert used["lang"] == "eng"
    assert out["source"] == "tesseract"
