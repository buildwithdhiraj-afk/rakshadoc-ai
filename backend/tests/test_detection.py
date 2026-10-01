"""Detector tests.

A synthetic PDF is built in-process so the assertions describe document
structure (a caption above its value, a grid, a checklist) rather than any one
user's file.
"""
import os
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import fitz

from ml.bbox import iou, sanitize_bbox
from ml.document_detection import (MAX_DETECTIONS, SENSITIVITY_ACTION,
                                   detect_document_components)
from ml.pdf_layout_detection import detect_pdf_page

W, H = 595.0, 842.0  # A4 points


def _pdf(path, pages):
    """Build a PDF; each entry is a function that draws one page."""
    doc = fitz.open()
    for draw in pages:
        page = doc.new_page(width=W, height=H)
        draw(page)
    doc.save(path)
    doc.close()
    return path


def _text(page, x, y, s, font="helv", size=10, color=(0, 0, 0)):
    page.insert_text((x, y), s, fontname=font, fontsize=size, color=color)


@pytest.fixture(scope="module")
def form_pdf(tmp_path_factory):
    """A form with a caption/value pair, a grid, and a bare-number checklist."""
    path = str(tmp_path_factory.mktemp("pdfs") / "form.pdf")

    def page1(page):
        _text(page, 60, 70, "APPLICATION FORM", size=18)
        _text(page, 60, 120, "Application ID : MC25106763", size=10)
        _text(page, 400, 120, "Version : 1", size=10)
        _text(page, 60, 150, "Date of Birth : 02-07-2005", size=10)
        _text(page, 60, 180, "Annual Income : Rs. 500000", size=10)
        # Ruled grid: a caption row plus two numeric data rows, in real
        # columns (the detector keys on horizontal spread).
        top, cols = 220, (60, 260, 400, 520)
        rows = [top + i * 18 for i in range(3)]
        for ry in rows:
            page.draw_line((cols[0], ry), (cols[-1], ry), width=0.6)
        for cx in cols:
            page.draw_line((cx, top), (cx, rows[-1]), width=0.6)
        grid = (("Subject", "Marks", "Out Of"),
                ("Maths", "350", "400"),
                ("Physics", "310", "400"))
        for i, ry in enumerate(rows):
            for cx, cell in zip(cols, grid[i]):
                _text(page, cx + 6, ry + 12, cell, size=9)

    def page2(page):
        _text(page, 60, 70, "Documents List", size=14)
        items = ["Statement of marks", "Graduation Marksheet",
                 "Score Card of the test", "Transfer Certificate",
                 "Migration Certificate"]
        for i, item in enumerate(items):
            y = 110 + i * 20
            _text(page, 70, y, str(i + 1), size=10)
            _text(page, 110, y, item, size=10)

    return _pdf(path, [page1, page2])


def _cats(dets):
    return {d["category"] for d in dets}


def _find(dets, category, contains=None):
    for d in dets:
        if d["category"] != category:
            continue
        if contains is None or contains in d.get("text", ""):
            return d
    return None


# --------------------------------------------------------------------------
# bbox contract shared by both passes
# --------------------------------------------------------------------------

@pytest.mark.parametrize("bad", [
    None, {}, {"x": 0.1}, "nope",
    {"x": float("nan"), "y": 0, "w": 0.2, "h": 0.2},
    {"x": 0.1, "y": 0.1, "w": 0, "h": 0.2},        # zero width
    {"x": -0.5, "y": 0.1, "w": 0.2, "h": 0.2},     # clamps, still valid
    {"x": 0.99, "y": 0.99, "w": 0.5, "h": 0.5},    # clamps to the page
    {"x": 0.1, "y": 0.1, "w": 0.001, "h": 0.001},  # below visible minimum
])
def test_sanitize_bbox_handles_bad_input(bad):
    out = sanitize_bbox(bad)
    if out is None:
        return
    assert 0.0 <= out["x"] <= 1.0 and 0.0 <= out["y"] <= 1.0
    assert out["w"] > 0 and out["h"] > 0
    assert out["x"] + out["w"] <= 1.0 + 1e-9
    assert out["y"] + out["h"] <= 1.0 + 1e-9


def test_iou_is_symmetric_and_bounded():
    a = {"x": 0.1, "y": 0.1, "w": 0.2, "h": 0.2}
    b = {"x": 0.2, "y": 0.2, "w": 0.2, "h": 0.2}
    assert iou(a, a) == pytest.approx(1.0)
    assert iou(a, b) == pytest.approx(iou(b, a))
    assert 0.0 < iou(a, b) < 1.0
    far = {"x": 0.7, "y": 0.7, "w": 0.1, "h": 0.1}
    assert iou(a, far) == 0.0


# --------------------------------------------------------------------------
# semantic (PDF text layer) pass
# --------------------------------------------------------------------------

def test_text_layer_detects_labelled_fields(form_pdf):
    dets = detect_pdf_page(form_pdf, 1)
    cats = _cats(dets)
    assert "identity_number" in cats
    assert "date" in cats
    assert "financial_info" in cats
    assert "title" in cats


def test_version_is_not_treated_as_identity_number(form_pdf):
    """Regression: a bare integer value must not promote a metadata caption."""
    dets = detect_pdf_page(form_pdf, 1)
    for d in dets:
        if d["category"] == "identity_number":
            assert "Version" not in d.get("text", "")


def test_neutral_labels_fall_back_to_paragraph():
    from ml.pdf_layout_detection import _classify_label
    for label in ("Version :", "Printed By :", "Page No :", "Form ID :"):
        assert _classify_label(label) == "paragraph"
    for label in ("Date of Birth", "Annual Income", "Application ID"):
        assert _classify_label(label) != "paragraph"


def test_sensitive_attributes_are_not_left_unprotected():
    """Regression: religion/caste/mother-tongue fell through to `paragraph`,
    which is NONE/NONE, so those fields shipped unprotected."""
    from ml.pdf_layout_detection import _classify_label
    for label in ("Religion", "Nationality", "Mother Tongue", "Gender",
                  "Candidate Category", "Marital Status", "Caste Category",
                  "Religious Minority", "Linguistic Minority", "Defence",
                  "Orphan"):
        assert _classify_label(label) == "person", label


def test_academic_name_captions_are_not_people():
    """Regression: `\\bname\\b` made "Mathematics Subject Name" a person name."""
    from ml.pdf_layout_detection import _classify_label, _refine_by_value
    for label in ("Mathematics Subject Name", "Graduation University",
                  "Graduation Faculty", "Qualification", "Marks Obtained"):
        assert _classify_label(label) == "paragraph", label
    assert _refine_by_value(_classify_label("Mathematics Subject Name"),
                            "Mathematics") == "paragraph"


def test_placeholder_values_do_not_invent_personal_attributes():
    """Regression: "Religion: N.A." and "Orphan: No" were emitted as `person`,
    asserting a religion or identity the form never stated."""
    from ml.pdf_layout_detection import _classify_label, _refine_by_value
    for label, value in (("Religion", "N.A."), ("Religion", "N.A"),
                         ("Linguistic Minority", "N.A"),
                         ("Defence", "N.A."), ("Orphan", "No"),
                         ("Religious Minority", "No")):
        got = _refine_by_value(_classify_label(label), value)
        assert got == "paragraph", f"{label}={value!r} -> {got}"
    # A real value on the same caption must still be detected.
    assert _refine_by_value(_classify_label("Religion"), "Hindu") == "person"
    assert _refine_by_value(_classify_label("Marital Status"), "Married") == "person"


def test_bare_number_income_is_not_read_as_a_phone_number():
    """Regression: a 6-digit income matched the loose phone pattern and the
    financial field was re-emitted as `person`."""
    from ml.pdf_layout_detection import _classify_label, _refine_by_value
    for label, value in (("Annual Family Income( ₹ )", "350000"),
                         ("Annual Income", "127450")):
        assert _refine_by_value(_classify_label(label), value) == "financial_info"


def test_no_page_wide_paragraph_over_a_dense_form(form_pdf):
    """The pixel pass used to emit one page-sized box; the semantic pass must not."""
    dets = detect_pdf_page(form_pdf, 1)
    for d in dets:
        if d["category"] == "paragraph":
            assert d["bbox"]["h"] < 0.5, f"oversized paragraph: {d}"


def test_title_is_the_largest_text_run_not_a_field_row(form_pdf):
    """Regression: captions set a hair above body size used to outrank the title."""
    dets = detect_pdf_page(form_pdf, 1)
    titles = [d for d in dets if d["category"] == "title"]
    assert titles, "expected the 18pt heading to be the title"
    box = titles[0]["bbox"]
    # The real title sits at the top of the page and is short.
    assert box["y"] < 0.10, f"title not at the top: {box}"
    assert box["h"] < 0.05, f"title spans more than one line: {box}"
    # It must not swallow the Application ID row that previously won.
    for d in dets:
        if d["category"] == "identity_number":
            assert box["y"] + box["h"] < d["bbox"]["y"], "title overlaps a field"


def test_ruled_grid_is_detected_as_one_table(form_pdf):
    dets = detect_pdf_page(form_pdf, 1)
    tables = [d for d in dets if d["category"] == "table"]
    assert tables, "expected the ruled grid to be detected"
    top = tables[0]
    # One box must span the whole grid rather than one box per cell.
    assert top["bbox"]["h"] > 0.04
    assert top["bbox"]["y"] < 0.30


def test_bare_number_checklist_is_one_list_block(form_pdf):
    """Regression: markers rendered as their own cell, with no '.' or ')'."""
    dets = detect_pdf_page(form_pdf, 2)
    lists = [d for d in dets if d["category"] == "list"]
    assert lists, "expected the enumerated checklist to be detected"
    assert lists[0]["bbox"]["h"] > 0.05


def test_list_detection_does_not_eat_numeric_table_rows(form_pdf):
    """The marks grid must stay a table, not a list of numbers."""
    dets = detect_pdf_page(form_pdf, 1)
    lists = [d for d in dets if d["category"] == "list"]
    for d in lists:
        assert d["bbox"]["h"] < 0.2


# --------------------------------------------------------------------------
# merged contract of the public entry point
# --------------------------------------------------------------------------

@pytest.mark.parametrize("page_no", [1, 2])
def test_every_detection_is_valid_and_policy_tagged(form_pdf, page_no):
    png = form_pdf.replace(".pdf", "_p%d.png" % page_no)
    with fitz.open(form_pdf) as doc:
        doc[page_no - 1].get_pixmap(dpi=144).save(png)

    dets = detect_document_components(png, pdf_path=form_pdf, page_no=page_no)
    assert dets, "expected detections for a populated form"
    assert len(dets) <= MAX_DETECTIONS
    for d in dets:
        b = d["bbox"]
        assert b == sanitize_bbox(b), f"unvalidated bbox: {d}"
        assert 0.0 <= b["x"] and 0.0 <= b["y"]
        assert b["w"] > 0 and b["h"] > 0
        assert b["x"] + b["w"] <= 1.0 + 1e-3
        assert b["y"] + b["h"] <= 1.0 + 1e-3
        assert 0.0 <= d["confidence"] <= 1.0
        assert d["category"] in SENSITIVITY_ACTION, f"no policy for {d['category']}"
        assert d["sensitivity"] in ("NONE", "LOW", "MEDIUM", "HIGH")
        assert d["action"] in ("NONE", "PROTECTED")


def test_personal_categories_are_protected(form_pdf):
    png = form_pdf.replace(".pdf", "_p1.png")
    if not os.path.exists(png):
        with fitz.open(form_pdf) as doc:
            doc[0].get_pixmap(dpi=144).save(png)
    dets = detect_document_components(png, pdf_path=form_pdf, page_no=1)
    for d in dets:
        if d["category"] in ("identity_number", "date", "financial_info",
                             "person", "address", "signature", "qr_code"):
            assert d["action"] == "PROTECTED", d


def test_pixel_only_call_still_works(form_pdf):
    """Scans have no PDF to hand; the visual pass must stand alone."""
    png = form_pdf.replace(".pdf", "_p1.png")
    dets = detect_document_components(png)
    assert isinstance(dets, list)
    for d in dets:
        assert d["category"] in SENSITIVITY_ACTION


def test_missing_image_yields_no_detections(tmp_path):
    assert detect_document_components(str(tmp_path / "nope.png")) == []


def test_all_frontend_categories_have_a_policy():
    for category in ("title", "heading", "paragraph", "table", "list", "figure",
                     "signature", "stamp", "seal", "logo", "qr_code", "person",
                     "date", "identity_number", "address", "financial_info"):
        assert category in SENSITIVITY_ACTION, category


def test_hf_layout_is_dormant_unless_opted_in():
    """The pretrained model must never load implicitly; detection works without it."""
    from ml import hf_layout_detection as H
    assert H.is_enabled() is False
    assert H.refine_page(None, []) == []


def test_hf_layout_failure_degrades_to_no_additions():
    """A bad image or missing weights must not raise or invent boxes."""
    from ml import hf_layout_detection as H
    assert H.refine_page(np.zeros((4, 4, 3), np.uint8), []) == []


def test_hf_layout_only_adds_never_replaces():
    """Refinement is strictly additive: existing detections are left untouched."""
    from ml import hf_layout_detection as H
    existing = [{"category": "title", "bbox": {"x": 0.1, "y": 0.1, "w": 0.5, "h": 0.2},
                 "confidence": 0.95}]
    snapshot = [dict(d) for d in existing]
    page = np.zeros((600, 400, 3), np.uint8)
    added = H.refine_page(page, existing)
    assert existing == snapshot, "existing detections were mutated"
    for a in added:
        assert a["category"] in SENSITIVITY_ACTION
