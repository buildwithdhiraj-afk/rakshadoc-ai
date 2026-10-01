"""Text-aware layout and entity detection for born-digital PDFs.

A rendered-page (OpenCV) detector has to guess where a field label ends and
its value begins, which is why dense forms collapse into one big "paragraph"
box. When the PDF carries a real text layer, PyMuPDF exposes exact glyph
rectangles plus per-span styling, so the same fields can be located precisely
instead of inferred from pixels.

This module produces normalized bboxes (0..1 of the page) in the *same*
coordinate space as the rendered ``page_N.png`` used by the frontend, so the
overlay keeps landing on the pixels it describes. It is a strict improvement
over the pixel pipeline for digital documents; ``document_detection`` falls
back to OpenCV whenever a page has no usable text layer.

Structure recovered:
- ``title``                  largest leading text block
- ``heading``                isolated, centred or all-caps section captions
- ``date`` / ``identity_number`` / ``address`` / ``person`` / ``financial_info``
                             values of labelled form fields, classified from
                             the caption text (and confirmed by the value)
- ``list``                   numbered / bulleted items, merged into blocks
- ``table``                  runs of aligned numeric rows plus their header
- ``paragraph``              remaining prose runs
- ``qr_code`` / ``person`` / ``logo`` / ``figure``   placed images
- ``signature``              the form cell a "Signature of ..." caption owns

Nothing is invented: every box is backed by real glyph, image or rule geometry
read from the file.
"""
import re
from collections import Counter
from typing import Dict, List, Optional, Tuple

import cv2
import fitz  # PyMuPDF
import numpy as np

# Reuse the single validation implementation so both pipelines emit
# byte-identical bbox shapes.
from ml.bbox import sanitize_bbox

# ---------------------------------------------------------------------------
# Semantic classification
# ---------------------------------------------------------------------------

# Ordered: the first matching rule wins, so specific rules come first.
# Kept deliberately narrow: a caption that is not a real date / identifier /
# money / address / identity field stays a generic `paragraph` rather than
# being forced into a sensitive category.
_LABEL_RULES: List[Tuple[str, str]] = [
    ("date", r"\bdate\b|\bd\.?o\.?b\b|date of birth|birth\b|\bissued\b|\bexpiry\b|"
             r"valid\s*(upto|until|till)|onwards|deadline|passing\s*year|"
             r"(created|modified|printed)\s*(on|date)"),
    ("identity_number", r"application\s*(id|no\.?|number)|registration\s*(no\.?|number)|"
                        r"roll\s*no|aadhaar|\bpan\b|passport|voter|identity\s*(no\.?|number)|"
                        r"bank\s*a/?c|account\s*no|candidate\s*id|pre-?registration|"
                        r"serial\s*no|reference\s*no"),
    ("financial_info", r"\bfee\b|\bincome\b|\bamount\b|\bpaid\b|\btotal\b|\bcost\b|"
                       r"\bsalary\b|\brs\.?\b|rupee|bhakti|scholarship|discount|"
                       r"\bfees?\s*(paid|due|waived)\b|\bbank\s*balance\b"),
    ("address", r"address|residence|residing|\bcity\b|\bdistrict\b|\bplace\b|"
                r"village|pin\s*code|\bzip\b|street|province|country|locality|"
                r"\bstate\b"),
    ("person", r"candidate\s*(full\s*)?name|applicant\s*name|\bname\b|father|mother|"
               r"spouse|guardian|gender|\bsex\b|nationality|signature|"
               r"religion|religious| mother\s*tongue|language\s*spoken|caste|"
               r"category|marital\s*status|domicile|citizenship|"
               r"linguistic\s*minority|disab|orphan|defen[cs]e|"
               r"\bews\b|\bsebc\b|\bobc\b|\bsbc\b|\bntc\b|\bminority\b"),
]
_FALLBACK_CATEGORY = "paragraph"

# Academic captions end in the word "name" but hold a subject, board or college,
# not a person: "Mathematics Subject Name" must not make its value a person name.
# Checked before _LABEL_RULES so `\bname\b` cannot over-reach into education.
_NON_PERSON_NAME_RE = re.compile(
    r"\b(?:subject|subjects|board|college|institution|school|university|"
    r"course|department|faculty|stream|company|employer|bank|branch)\s*"
    r"(?:name|names)?\b"
    r"|\bqualification\b|\bmarks?\b|\bpercentage\b|\bdivision\b|\bgrade\b",
    re.I,
)

# These captions look like identity fields to the rules above but carry no
# personal value. "Version" is the important one: `\bname\b` does not reach it,
# but a bare integer value trips the ID-value refinement, so the caption has to
# be excluded explicitly or it is emitted as a meaningless identity_number.
_NEUTRAL_LABELS = (
    r"version|edition|copy|page\s*(no\.?|number)|rev(ision)?|serial|"
    r"format|template|form\s*(no\.?|id|number)|document\s*(type|no\.?|number)|"
    r"date\s*of\s*download|printed\s*by|printed\s*on|generated\s*(on|by)"
)
_NEUTRAL_LABEL_RE = re.compile(_NEUTRAL_LABELS, re.I)

# Placeholders that assert nothing. "N.A." under "Religion" is not a religion, and
# boxing it as `person` invents a personal attribute the form never stated. The
# caption is still known, so the field stays covered as a neutral paragraph.
_NULL_VALUES = {"na", "n/a", "n.a", "n.a.", "na.", "n.a..", "nil", "none",
                "not applicable", "not available", "-", "--", "---", "?",
                "unknown", "blank", "no information", "not specified",
                "yes", "no", "y", "n", "true", "false", "t", "f"}
_YEAR_RE = re.compile(r"^(?:19|20)\d{2}$")
_DATE_VALUE_RE = re.compile(
    r"\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}"
    r"|\d{4}-\d{1,2}-\d{1,2}"
    r"|\d{1,2}\s+[A-Za-z]{3,9}\.?\s+\d{2,4}"
    r"|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b"
)
_MONTHS_RE = re.compile(
    r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|"
    r"April|June|July|August|September|October|November|December)\b", re.I)
_ID_VALUE_RE = re.compile(r"^[A-Z]{1,6}[-/]?\d{4,}$", re.I)
# Money needs explicit currency context; a bare "127.23" inside an IP address
# or a percentile must not be mistaken for an amount.
_MONEY_RE = re.compile(r"[$]|\b(?:rs\.?|inr|usd|eur)\b|\b\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?\b",
                       re.I)
_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
_PHONE_RE = re.compile(r"(?:\+\d{1,3}[\s-]?)?(?:\(\d{2,4}\)[\s-]?)?\d{3,5}[\s-]?\d{3,5}")
_LIST_RE = re.compile(r"^\s*(?:\(?\d{1,2}[.)]|[a-z][.)]|[-•▪*‣])\s+")
_MARKER_CELL_RE = re.compile(r"^\(?\d{1,2}[.)]?$")
_NUMERIC_RE = re.compile(r"^[\s\d.,%()/:+-]*\d[\s\d.,%()/:+-]*$")

# Geometry / layout gates, expressed as fractions of the page.
_CENTER_TOLERANCE = 0.08
_HEADING_MAX_WORDS = 6
_ROW_OVERLAP = 0.40          # vertical overlap that makes items "one row"
_ROW_GAP_FACTOR = 1.6        # max line gap that keeps rows in one block
_DATA_ROW_MIN_CELLS = 2
_TABLE_SPREAD = 0.12         # min horizontal spread of numeric cells
_TITLE_TOP_FRACTION = 0.40
_TITLE_SIZE_RATIO = 1.05
# Font sizes are rounded to whole points by most producers, so lines that belong
# to the same visual tier can differ slightly. Anything within this of the
# largest size counts as the same tier.
_TITLE_SIZE_TOLERANCE = 0.6


# ---------------------------------------------------------------------------
# Small geometry helpers
# ---------------------------------------------------------------------------

def _nrect(page_rect, box) -> Dict[str, float]:
    """Normalize a PDF-space rect against the page rect (0..1, clamped)."""
    x0, y0, x1, y1 = box
    w = float(page_rect.width) or 1.0
    h = float(page_rect.height) or 1.0
    return {
        "x": x0 / w,
        "y": y0 / h,
        "w": max(0.0, (x1 - x0)) / w,
        "h": max(0.0, (y1 - y0)) / h,
    }


def _union(boxes) -> Optional[Tuple[float, float, float, float]]:
    if not boxes:
        return None
    return (min(b[0] for b in boxes), min(b[1] for b in boxes),
            max(b[2] for b in boxes), max(b[3] for b in boxes))


def _iouf(a: Dict[str, float], b: Dict[str, float]) -> float:
    ix = max(0.0, min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"]))
    iy = max(0.0, min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"]))
    inter = ix * iy
    if inter <= 0:
        return 0.0
    union = a["w"] * a["h"] + b["w"] * b["h"] - inter
    return inter / union if union > 0 else 0.0


def _covers(inner: Dict[str, float], outer: Dict[str, float], tol: float = 0.5) -> bool:
    """True when `inner` sits mostly inside `outer`."""
    area = inner["w"] * inner["h"]
    if area <= 0:
        return False
    ix = max(0.0, min(inner["x"] + inner["w"], outer["x"] + outer["w"]) - max(inner["x"], outer["x"]))
    iy = max(0.0, min(inner["y"] + inner["h"], outer["y"] + outer["h"]) - max(inner["y"], outer["y"]))
    return (ix * iy) / area > tol


def _covered_by_any(inner: Dict[str, float], outers: List[Dict[str, float]],
                    tol: float = 0.5) -> bool:
    """True when `inner` sits mostly inside any box in `outers`."""
    return any(_covers(inner, o, tol) for o in outers)


def _det(category: str, box_norm: Dict[str, float], confidence: float) -> Optional[Dict]:
    bbox = sanitize_bbox(box_norm)
    if bbox is None:
        return None
    return {"category": category, "bbox": bbox,
            "confidence": round(max(0.0, min(1.0, confidence)), 2)}


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------

class _Line:
    """One visual text line: box, text and per-span styling."""

    __slots__ = ("box", "text", "size", "style")

    def __init__(self, box, text: str, size: float, style):
        self.box = box
        self.text = text
        self.size = size
        self.style = style          # (font_name, flags) of the dominant span

    @property
    def y0(self):
        return self.box[1]

    @property
    def y1(self):
        return self.box[3]

    @property
    def height(self):
        return max(self.box[3] - self.box[1], 1e-6)

    @property
    def center_y(self):
        return (self.box[1] + self.box[3]) / 2.0

    @property
    def x1(self):
        return self.box[2]


def _rotated_box(bx, mat):
    tl = fitz.Point(bx[0], bx[1]) * mat
    br = fitz.Point(bx[2], bx[3]) * mat
    return (min(tl.x, br.x), min(tl.y, br.y), max(tl.x, br.x), max(tl.y, br.y))


def _segments_from_line(line, mat):
    """Style runs of one text line, with page rotation applied.

    `rawdict` is used so every character keeps its own real bbox. That is what
    lets an inline "Caption : value" be split at the exact colon rather than
    guessing a sub-box from the surrounding line rectangle.

    Returns segments as (text, box, size, style, char_boxes) where char_boxes
    is a list of (char, box) in text order.
    """
    segments = []
    for s in line.get("spans", []):
        style = (s.get("font", ""), int(s.get("flags", 0)))
        size = float(s.get("size", 0.0))
        for ch in s.get("chars", []):
            c = ch.get("c", "")
            # Whitespace is kept in the text so offsets stay aligned with the
            # regex, but only inked characters contribute to the geometry.
            cb = _rotated_box(ch["bbox"], mat)
            if segments and segments[-1][3] == style:
                seg = segments[-1]
                seg[0] += c
                seg[4].append((c, cb))
                if c.strip():
                    seg[5].append(cb)
            else:
                segments.append([c, cb, size, style, [(c, cb)],
                                 [cb] if c.strip() else []])
    out = []
    for text, _first, size, style, char_boxes, ink in segments:
        box = _union(ink) if ink else None
        if box is None or not text.strip():
            continue
        out.append((text, box, size, style, char_boxes))
    return out


def _is_field_caption(text: str) -> bool:
    """Is this styled run a form caption whose value sits beside it?"""
    stripped = text.rstrip()
    if not stripped.endswith(":"):
        return False
    label = stripped.rstrip(":").strip()
    if not label or len(label) > 60:
        return False
    return _classify_label(label) != _FALLBACK_CATEGORY


def _ink_boxes(segment):
    """Boxes of the inked characters of one segment."""
    return [cb for c, cb in segment[4] if c.strip() and cb is not None]


# "Application ID : MC25106763" — caption, colon, filled-in value.
_INLINE_FIELD_RE = re.compile(r"^(?P<label>[^:]{2,60}?)\s*:\s*(?P<value>\S.*)$")


def _split_inline_field(segment):
    """Split one styled run into caption/value _Lines at its colon.

    Returns None unless the caption alone identifies a personal field, so
    ordinary prose containing a colon ("Declaration: I have read ...") stays
    one intact paragraph.
    """
    text, box, size, style, char_boxes = segment
    m = _INLINE_FIELD_RE.match(text.strip())
    if not m:
        return None
    label = m.group("label").strip()
    if not label or _classify_label(label) == _FALLBACK_CATEGORY:
        return None

    # char_boxes is index-aligned with `text`, so the regex offsets map
    # straight across. Only inked characters may extend a box.
    lead = len(text) - len(text.lstrip())
    cut = lead + m.start("value")
    lab_box = _union([cb for c, cb in char_boxes[:cut] if c.strip()])
    val_box = _union([cb for c, cb in char_boxes[cut:] if c.strip()])
    if lab_box is None or val_box is None:
        return None
    return (_Line(lab_box, label, size, style),
            _Line(val_box, m.group("value").strip(), size, style))


def _extract_lines(page, mat) -> List[_Line]:
    """Lines with page rotation applied, so boxes match the rendered page."""
    out: List[_Line] = []
    for block in page.get_text("rawdict").get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            segments = _segments_from_line(line, mat)
            if not segments:
                continue
            segments.sort(key=lambda sg: sg[1][0])

            def emit(sg):
                split = _split_inline_field(sg)
                if split:
                    out.extend(split)
                else:
                    out.append(_Line(sg[1], sg[0].strip(), sg[2], sg[3]))

            # Only a *recognised field caption* is separated from the value
            # beside it. Splitting every "word :" would shred prose and section
            # headings into fragments, so the caption must already classify as
            # a personal field.
            groups, current = [], []
            for sg in segments:
                if _is_field_caption(sg[0]):
                    if current:
                        groups.append(current)
                    groups.append([sg])
                    current = []
                else:
                    current.append(sg)
            if current:
                groups.append(current)

            for group in groups:
                if len(group) == 1:
                    emit(group[0])
                    continue
                text = " ".join(sg[0].strip() for sg in group).strip()
                box = _union([b for sg in group for b in _ink_boxes(sg)])
                if not text or box is None:
                    continue
                style = Counter()
                for sg in group:
                    style[sg[3]] += len(sg[0])
                size = max((sg[2] for sg in group if sg[2] > 0), default=0.0)
                out.append(_Line(box, text, size, style.most_common(1)[0][0]))
    out.sort(key=lambda l: (round(l.box[1], 2), l.box[0]))
    return out


def _body_size(lines: List[_Line]) -> float:
    """Modal font size = the document's body text size."""
    sizes = [round(l.size, 1) for l in lines if l.size > 0]
    return Counter(sizes).most_common(1)[0][0] if sizes else 0.0


def _group_rows(lines: List[_Line]) -> List[List[_Line]]:
    """Cluster lines whose vertical extents overlap into visual rows."""
    rows: List[List[_Line]] = []
    for line in lines:
        if rows:
            prev = rows[-1]
            top = min(l.box[1] for l in prev)
            bot = max(l.box[3] for l in prev)
            overlap = min(bot, line.box[3]) - max(top, line.box[1])
            if overlap > _ROW_OVERLAP * min(bot - top, line.height):
                prev.append(line)
                continue
        rows.append([line])
    for row in rows:
        row.sort(key=lambda l: l.box[0])
    return rows


def _median_gap(rows: List[List[_Line]]) -> float:
    gaps = []
    for prev, cur in zip(rows, rows[1:]):
        gap = cur[0].y0 - prev[-1].y1
        if gap > 0:
            gaps.append(gap)
    return float(np.median(gaps)) if gaps else 0.0


# ---------------------------------------------------------------------------
# Text predicates
# ---------------------------------------------------------------------------

def _numeric(text: str) -> bool:
    t = text.strip()
    return bool(t) and bool(_NUMERIC_RE.match(t)) and any(c.isdigit() for c in t)


def _is_data_row(row: List[_Line], page_w: float) -> bool:
    """A grid row: mostly numeric cells spread across the page width.

    Requiring numeric *dominance* (not just two numbers) keeps metadata rows
    that merely contain a date or an IP address from reading as tables.
    """
    if len(row) < _DATA_ROW_MIN_CELLS:
        return False
    nums = [l for l in row if _numeric(l.text)]
    if len(nums) < _DATA_ROW_MIN_CELLS or len(nums) < len(row) - 1:
        return False
    xs = sorted(l.box[0] for l in nums)
    return (xs[-1] - xs[0]) > _TABLE_SPREAD * page_w


def _classify_label(label: str) -> str:
    # Document-metadata captions are never personal fields, whatever the
    # generic rules say about the word.
    if _NEUTRAL_LABEL_RE.search(label):
        return _FALLBACK_CATEGORY
    if _NON_PERSON_NAME_RE.search(label):
        return _FALLBACK_CATEGORY
    for category, pattern in _LABEL_RULES:
        if re.search(pattern, label, re.I):
            return category
    return _FALLBACK_CATEGORY


def _refine_by_value(category: str, value: str) -> str:
    """A caption alone is weak evidence; the value itself can confirm it."""
    v = value.strip()
    if not v:
        return category
    # A placeholder or a bare yes/no states nothing about the attribute, so the
    # caption's category cannot be asserted. "Orphan: No" must not become a
    # person name, and "Religion: N.A." must not invent a religion.
    if v.lower().strip(". ") in _NULL_VALUES:
        return _FALLBACK_CATEGORY
    if _YEAR_RE.match(v):
        return "date"
    if _DATE_VALUE_RE.search(v) or _MONTHS_RE.search(v):
        return "date"
    if _MONEY_RE.search(v):
        return "financial_info"
    # Contact details are only promoted to `person` when the caption itself was
    # inconclusive. Otherwise a bare 6-digit income like "350000" matches the
    # loose phone pattern and would relabel a financial field as a person.
    if category == _FALLBACK_CATEGORY and (_EMAIL_RE.search(v) or _PHONE_RE.fullmatch(v)):
        return "person"
    if _ID_VALUE_RE.match(v.replace(" ", "")):
        return "identity_number"
    return category


def _is_label_value(a: _Line, b: _Line) -> bool:
    """Is `a` a caption whose filled-in value is `b`?"""
    at, bt = a.text.strip(), b.text.strip()
    if not at or not bt or b.box[0] <= a.x1:
        return False
    if _LIST_RE.match(at) or _LIST_RE.match(bt) or _numeric(at):
        return False
    # Primary evidence: forms render captions and values in different styles.
    if a.style != b.style:
        return True
    # A recognised caption is enough on its own. Its value is often numeric
    # ("Date of Birth" -> "02-07-2005"), which the style test cannot judge.
    if _classify_label(at.rstrip(":").strip()) != _FALLBACK_CATEGORY:
        return True
    # Fallback for documents that use one style throughout.
    return len(at.split()) >= 2 and not _numeric(bt)


def _label_with_value(row: List[_Line]) -> List[Tuple[_Line, _Line]]:
    """Pair captions with their values inside one visual row."""
    pairs: List[Tuple[_Line, _Line]] = []
    i = 0
    while i < len(row) - 1:
        if _is_label_value(row[i], row[i + 1]):
            pairs.append((row[i], row[i + 1]))
            i += 2
        else:
            i += 1
    return pairs


# ---------------------------------------------------------------------------
# Structure detectors
# ---------------------------------------------------------------------------

def _detect_title(lines: List[_Line], body: float, page_rect) -> Optional[Dict]:
    """Largest leading block of oversized text = the document title."""
    if body <= 0 or not lines:
        return None
    top_limit = _TITLE_TOP_FRACTION * float(page_rect.height)
    big = [l for l in lines if l.y0 < top_limit and l.size >= body * _TITLE_SIZE_RATIO]
    if not big:
        return None
    # Restrict to the largest size tier present. Without this, a document whose
    # captions sit just above body text lets every field row compete, and the
    # longest run wins over the real title. The tier is the largest size on the
    # page, so a title only a little above body text is still found.
    largest = max(l.size for l in big)
    big = [l for l in big if l.size >= largest - _TITLE_SIZE_TOLERANCE]
    if not big:
        return None
    runs, cur = [], [big[0]]
    for prev, line in zip(big, big[1:]):
        if line.box[1] - prev.y1 <= 0.9 * prev.height:
            cur.append(line)
        else:
            runs.append(cur)
            cur = [line]
    runs.append(cur)
    run = max(runs, key=lambda r: (len(r), -r[0].y0))
    # A lone oversized line low on the page is a section heading, not a title.
    if len(run) == 1 and run[0].y0 > 0.18 * float(page_rect.height):
        return None
    # A title is document text, not a run of form cells: it must not read as a
    # list marker, a grid row, or a caption/value pair.
    if _is_data_row(run, float(page_rect.width)):
        return None
    if any(_is_label_value(run[i], run[i + 1]) for i in range(len(run) - 1)):
        return None
    if _is_list_row(run):
        return None
    return _det("title", _nrect(page_rect, _union([l.box for l in run])), 0.95)


def _detect_fields(rows: List[List[_Line]], page_rect,
                   skip_rows: set) -> Tuple[List[Dict], set]:
    """Every labelled form value, classified from its caption.

    Table cells and signature captions are excluded: those are structure, not
    field values. Returns the detections plus the rows it consumed.
    """
    page_w = float(page_rect.width)
    out: List[Dict] = []
    consumed: set = set()
    for i, row in enumerate(rows):
        if i in skip_rows or _is_data_row(row, page_w):
            continue
        if re.search(r"\bsignature\b", _row_text(row), re.I):
            continue
        pairs = _label_with_value(row)
        if not pairs:
            continue
        for label_line, value_line in pairs:
            category = _refine_by_value(_classify_label(label_line.text), value_line.text)
            # The row is structure either way: the caption is a form label, not
            # document content, so it is consumed and only the value is emitted.
            consumed.add(i)
            if category == _FALLBACK_CATEGORY:
                # Not a personal field. Keep the value as text, but drop stubs
                # like the "1" of "Version : 1" that say nothing on their own.
                if len(value_line.text.strip()) < 3:
                    continue
                category, conf = _FALLBACK_CATEGORY, 0.74
            else:
                conf = 0.95
            det = _det(category, _nrect(page_rect, value_line.box), conf)
            if det:
                out.append(det)
    return out, consumed


def _row_text(row: List[_Line]) -> str:
    return " ".join(l.text.strip() for l in row).strip()


def _detect_tables(rows: List[List[_Line]], page_rect) -> Tuple[List[Dict], set]:
    """Runs of aligned numeric rows, merged with their header row.

    Returns the detections plus the indices of every row consumed, so callers
    do not re-emit table cells as loose fields or prose.
    """
    page_w = float(page_rect.width)
    data_idx = [i for i, row in enumerate(rows) if _is_data_row(row, page_w)]
    consumed: set = set()
    if not data_idx:
        return [], consumed

    groups, group = [], [data_idx[0]]
    for prev, cur in zip(data_idx, data_idx[1:]):
        gap = rows[cur][0].y0 - rows[prev][-1].y1
        if cur == prev + 1 and gap <= _ROW_GAP_FACTOR * rows[prev][-1].height:
            group.append(cur)
        else:
            groups.append(group)
            group = [cur]
    groups.append(group)

    results = []
    for group in groups:
        consumed.update(group)
        members = [l for i in group for l in rows[i]]
        # Pull in the column-caption row directly above, when present.
        head = group[0] - 1
        if head >= 0 and not _is_data_row(rows[head], page_w):
            gap = rows[group[0]][0].y0 - rows[head][-1].y1
            if gap <= _ROW_GAP_FACTOR * rows[head][-1].height:
                members = list(rows[head]) + members
                consumed.add(head)
        conf = 0.9 if len(members) >= 3 else 0.84
        det = _det("table", _nrect(page_rect, _union([m.box for m in members])), conf)
        if det:
            results.append(det)
    return results, consumed


def _is_list_row(row: List[_Line]) -> bool:
    """An enumerated item: a marker cell (or inline marker) plus body text."""
    if _LIST_RE.match(_row_text(row)):
        return True
    # Checklists often render the number in its own narrow cell with no
    # punctuation: "1" | "Statement of marks ...".
    if len(row) >= 2 and _MARKER_CELL_RE.match(row[0].text.strip()):
        return bool(" ".join(l.text for l in row[1:]).strip())
    return False


def _detect_lists(rows: List[List[_Line]], page_rect, skip_rows: set) -> Tuple[List[Dict], set]:
    """Contiguous enumerated rows merged into blocks."""
    idx = [i for i, row in enumerate(rows) if i not in skip_rows and _is_list_row(row)]
    consumed: set = set(skip_rows)
    if not idx:
        return [], consumed
    groups, group = [], [idx[0]]
    for prev, cur in zip(idx, idx[1:]):
        gap = rows[cur][0].y0 - rows[prev][-1].y1
        if cur == prev + 1 and gap <= _ROW_GAP_FACTOR * rows[prev][-1].height:
            group.append(cur)
        else:
            groups.append(group)
            group = [cur]
    groups.append(group)

    results = []
    for group in groups:
        if len(group) < 2:
            continue
        members = [l for i in group for l in rows[i]]
        # Absorb the wrapped caption lines directly above the first item.
        j = group[0] - 1
        while j >= 0 and j not in consumed and len(rows[j]) == 1 and not _is_list_row(rows[j]):
            gap = rows[j + 1][0].y0 - rows[j][-1].y1
            if gap > _ROW_GAP_FACTOR * rows[j][-1].height or group[0] - j > 3:
                break
            members = list(rows[j]) + members
            consumed.add(j)
            j -= 1
        det = _det("list", _nrect(page_rect, _union([m.box for m in members])), 0.9)
        if det:
            results.append(det)
            consumed.update(group)
    return results, consumed


def _detect_headings(rows: List[List[_Line]], body: float, page_rect,
                     median_gap: float, skip: List[Dict[str, float]],
                     skip_rows: set) -> List[Dict]:
    """Isolated, short, centred or all-caps single-line section captions."""
    out: List[Dict] = []
    page_w = float(page_rect.width)
    mid = page_w / 2.0
    for i, row in enumerate(rows):
        if i in skip_rows or len(row) != 1:
            continue
        line = row[0]
        text = line.text.strip()
        if not text or len(text.split()) > _HEADING_MAX_WORDS:
            continue
        if text.endswith(":") or _LIST_RE.match(text) or _numeric(text):
            continue
        norm = _nrect(page_rect, line.box)
        if _covered_by_any(norm, skip):
            continue
        gap_above = line.y0 - rows[i - 1][-1].y1 if i > 0 else float("inf")
        gap_below = rows[i + 1][0].y0 - line.y1 if i < len(rows) - 1 else float("inf")
        isolated = max(gap_above, gap_below) > 2.0 * median_gap if median_gap > 0 else True
        centered = abs((line.box[0] + line.box[2]) / 2.0 - mid) <= _CENTER_TOLERANCE * page_w
        all_caps = text.isupper() and len(text.split()) <= 5
        oversized = body > 0 and line.size >= body * _TITLE_SIZE_RATIO
        if not (isolated and (centered or all_caps or oversized)):
            continue
        det = _det("heading", norm, 0.9 if (all_caps or oversized) else 0.84)
        if det:
            out.append(det)
    return out


def _detect_paragraphs(rows: List[List[_Line]], page_rect,
                       skip_rows: set, skip: List[Dict[str, float]]) -> List[Dict]:
    """Remaining prose, merged into reading blocks.

    Multi-cell rows count too: a row whose cells are neither a numeric grid nor
    a caption/value pair is still content and must not be silently dropped.
    """
    page_w = float(page_rect.width)
    remaining: List[_Line] = []
    for i, row in enumerate(rows):
        if i in skip_rows:
            continue
        for line in row:
            if _covered_by_any(_nrect(page_rect, line.box), skip):
                continue
            if line.text.strip().endswith(":"):
                continue
            remaining.append(line)
    if not remaining:
        return []

    groups: List[List[_Line]] = [[remaining[0]]]
    for prev, line in zip(remaining, remaining[1:]):
        gap = line.y0 - prev.y1
        same_col = abs(line.box[0] - prev.box[0]) < 0.10 * page_w
        if gap <= _ROW_GAP_FACTOR * prev.height and same_col:
            groups[-1].append(line)
        else:
            groups.append([line])

    results = []
    for group in groups:
        det = _det("paragraph", _nrect(page_rect, _union([g.box for g in group])),
                   min(0.88, 0.72 + 0.02 * len(group)))
        if det:
            results.append(det)
    return results


# ---------------------------------------------------------------------------
# Graphics detectors
# ---------------------------------------------------------------------------

def _decode_qr_from_pixels(page_image, bbox_norm: Dict[str, float]) -> bool:
    """Try a QR decode on the real composited pixels of a region."""
    if page_image is None:
        return False
    try:
        h, w = page_image.shape[:2]
        x0 = max(0, int(bbox_norm["x"] * w))
        y0 = max(0, int(bbox_norm["y"] * h))
        x1 = min(w, int((bbox_norm["x"] + bbox_norm["w"]) * w))
        y1 = min(h, int((bbox_norm["y"] + bbox_norm["h"]) * h))
        if x1 - x0 < 16 or y1 - y0 < 16:
            return False
        crop = page_image[y0:y1, x0:x1]
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if crop.ndim == 3 else crop
        gray = cv2.copyMakeBorder(gray, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=255)
        detector = cv2.QRCodeDetector()
        ok, _, _ = detector.detectAndDecode(gray)
        if ok:
            return True
        _, _, pts = detector.detect(gray)
        return pts is not None
    except Exception:
        return False


def _nearest_text(lines: List[_Line], box) -> str:
    """Caption nearest a graphic, used to name logos and photographs."""
    cx, cy = (box[0] + box[2]) / 2.0, (box[1] + box[3]) / 2.0
    best, best_d = "", float("inf")
    for line in lines:
        lx, ly = (line.box[0] + line.box[2]) / 2.0, line.center_y
        d = (lx - cx) ** 2 + (ly - cy) ** 2
        if d < best_d:
            best, best_d = line.text, d
    return best


def _detect_images(page, lines: List[_Line], page_rect, page_image=None) -> List[Dict]:
    """Classify every placed image: QR, logo, photograph or generic figure."""
    results: List[Dict] = []
    try:
        infos = page.get_image_info(xrefs=True)
    except Exception:
        return results

    for info in infos:
        bbox = info.get("bbox")
        if not bbox:
            continue
        x0, y0, x1, y1 = bbox
        if (x1 - x0) <= 2 or (y1 - y0) <= 2:
            continue
        norm = _nrect(page_rect, (x0, y0, x1, y1))
        aspect = (x1 - x0) / float(y1 - y0)
        caption = _nearest_text(lines, (x0, y0, x1, y1)).lower()

        if _decode_qr_from_pixels(page_image, norm):
            det = _det("qr_code", norm, 0.97)
        elif re.search(r"\b(logo|emblem|seal of)\b", caption):
            det = _det("logo", norm, 0.85)
        elif re.search(r"\b(photo|photograph|passport size|picture|signature)\b", caption):
            det = _det("person", norm, 0.85)
        elif norm["y"] < 0.12 and 0.55 <= aspect <= 1.8 and norm["w"] < 0.25:
            det = _det("logo", norm, 0.72)
        elif 0.6 <= aspect <= 1.7 and 0.04 <= norm["w"] <= 0.45 and 0.04 <= norm["h"] <= 0.45:
            det = _det("person", norm, 0.72)
        else:
            det = _det("figure", norm, 0.7)
        if det:
            results.append(det)
    return results


def _rules_from_drawings(page, mat):
    """Horizontal and vertical rule segments in rotated page space."""
    horiz: List[Tuple[float, float, float, float]] = []
    vert: List[Tuple[float, float, float, float]] = []
    try:
        drawings = page.get_drawings()
    except Exception:
        return horiz, vert
    for d in drawings:
        try:
            r = d["rect"]
            p0 = fitz.Point(r.x0, r.y0) * mat
            p1 = fitz.Point(r.x1, r.y1) * mat
            box = (min(p0.x, p1.x), min(p0.y, p1.y), max(p0.x, p1.x), max(p0.y, p1.y))
        except Exception:
            continue
        w, h = box[2] - box[0], box[3] - box[1]
        if w <= 1 or h <= 1:
            continue
        if h <= 2.0 and w >= 20.0:
            horiz.append(box)
        elif w <= 2.0 and h >= 20.0:
            vert.append(box)
    return horiz, vert


def _detect_signature_cell(page, rows: List[List[_Line]], page_rect, mat) -> List[Dict]:
    """The form cell a "Signature of ..." caption belongs to."""
    horiz, vert = _rules_from_drawings(page, mat)
    page_w = float(page_rect.width)
    results: List[Dict] = []

    for row in rows:
        for line in row:
            if not re.search(r"\bsignature\b", line.text, re.I):
                continue
            if _LIST_RE.match(line.text.strip()):
                continue
            lx0, ly0, lx1, ly1 = line.box
            label_h = max(ly1 - ly0, 1.0)

            below = sorted(h[1] for h in horiz
                           if h[1] > ly1 and h[1] - ly1 <= 3.0 * label_h)
            y1 = below[0] if below else ly1 + 2.2 * label_h

            lefts = [v[0] for v in vert
                     if v[0] <= lx0 + 0.02 * page_w and lx0 - v[0] <= 0.10 * page_w
                     and v[1] <= y1 and v[3] >= ly0 - label_h]
            rights = [v[0] for v in vert
                      if v[0] >= lx1 - 0.02 * page_w and v[0] - lx1 <= 0.10 * page_w
                      and v[1] <= y1 and v[3] >= ly0 - label_h]
            x0 = max(lefts) if lefts else lx0
            x1 = min(rights) if rights else lx1
            if x1 - x0 < 0.06 * page_w or y1 - ly1 < 0.4 * label_h:
                x0, x1, y1 = lx0, lx1, ly1 + 1.6 * label_h

            det = _det("signature", _nrect(page_rect, (x0, ly0, x1, y1)), 0.88)
            if det:
                results.append(det)
    return results


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def detect_pdf_page(pdf_path: str, page_no: int, page_image=None) -> List[Dict]:
    """Structured detections for one PDF page (normalized 0..1 bboxes).

    ``page_image`` is the rendered BGR page used by the frontend; supplying it
    lets QR codes be decoded from real composited pixels. Returns [] when the
    page has no usable text layer so the caller can fall back to the pixel
    pipeline. Never invents boxes.
    """
    try:
        with fitz.open(pdf_path) as pdf:
            if page_no < 1 or page_no > pdf.page_count:
                return []
            page = pdf[page_no - 1]
            mat = page.rotation_matrix if page.rotation else fitz.Identity
            lines = _extract_lines(page, mat)
            if not lines:
                return []
            body = _body_size(lines)
            if body <= 0:
                return []

            rows = _group_rows(lines)
            gap = _median_gap(rows)
            dets: List[Dict] = []

            title = _detect_title(lines, body, page.rect)
            if title:
                dets.append(title)

            tables, table_rows = _detect_tables(rows, page.rect)
            dets.extend(tables)

            lists, list_rows = _detect_lists(rows, page.rect, table_rows)
            dets.extend(lists)

            consumed = table_rows | list_rows
            fields, field_rows = _detect_fields(rows, page.rect, consumed)
            dets.extend(fields)
            consumed |= field_rows

            skip = [t["bbox"] for t in tables] + [l["bbox"] for l in lists]
            skip += [f["bbox"] for f in fields]
            if title:
                skip.append(title["bbox"])

            headings = _detect_headings(rows, body, page.rect, gap, skip, consumed)
            dets.extend(headings)

            images = _detect_images(page, lines, page.rect, page_image)
            dets.extend(images)
            signatures = _detect_signature_cell(page, rows, page.rect, mat)
            dets.extend(signatures)

            skip += [d["bbox"] for d in headings]
            skip += [d["bbox"] for d in images] + [d["bbox"] for d in signatures]
            dets.extend(_detect_paragraphs(rows, page.rect, consumed, skip))

            # Semantic geometry beats coarse pixel guesses on heavy overlap.
            dets.sort(key=lambda d: -d["confidence"])
            kept: List[Dict] = []
            for d in dets:
                if any(_iouf(d["bbox"], k["bbox"]) > 0.5 for k in kept):
                    continue
                # A small box swallowed by a kept region of another category is
                # the same content described twice, not a separate element.
                if any(k["bbox"] != d["bbox"] and k["category"] != d["category"]
                       and _covers(d["bbox"], k["bbox"], 0.7) for k in kept):
                    continue
                kept.append(d)

            kept.sort(key=lambda d: (round(d["bbox"]["y"], 3), round(d["bbox"]["x"], 3)))
            return kept
    except Exception:
        return []
