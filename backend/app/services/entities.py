"""Named-entity extraction over extracted document text.

Deliberately rule-based rather than a transformer: every entity returned is a
literal string that appears in the text that was actually extracted, so
nothing is invented. Text the patterns do not recognise is simply absent.

Both layouts found in real forms are handled:
- `Label : value` on one line,
- a label line followed by its value on the next line.
"""
import re
from typing import Dict, List

# Label -> entity type. Ordered so the more specific labels win.
_LABEL_TYPES = (
    (r"full\s*name|candidate\s*name|name\s*of\s*(?:the\s*)?(?:applicant|candidate|student|person)"
     r"|(?:applicant|candidate|student|holder|guardian)'?s?\s*name|^name\b", "PERSON"),
    (r"date\s*of\s*birth|\bd\.?o\.?b\b|\bdate\b|\bdd-mm-yyyy\b", "DATE"),
    (r"e-?mail", "EMAIL"),
    (r"mobile|phone|contact\s*(?:no|number)", "PHONE"),
    (r"application\s*(?:no|id|number)|registration\s*(?:no|id|number)|roll\s*no"
     r"|candidate\s*id|aadhaar|\bpan\b|\bpin\s*code\b|\bpincode\b", "ID"),
    (r"district|city|town|village|state|country|place\s*of\b|address", "LOCATION"),
)

_LABEL_RE = re.compile(
    r"^(?P<label>[A-Za-z][A-Za-z0-9 .()'/-]{1,70}?)"
    r"\s*[:\-–]\s*(?P<inline>.+)$"
)

# Separator between a label and an inline value. A bare hyphen is not a
# separator: forms are full of hyphenated words (MAH-MCA-CET, DD-MM-YYYY).
_INLINE_SEP_RE = re.compile(r"^(?P<label>[A-Za-z][A-Za-z0-9 .()'/-]{1,70}?)\s*(?::|\s[-–]\s)\s*(?P<inline>.+)$")

# Instruction/note lines that mention field names without holding a value.
_NOTE_RE = re.compile(r"note|means|shall|check|verify|match|score", re.I)
_PLACEHOLDER_RE = re.compile(r"^(?:[YMDXWDH]{2,4}[-/]?)+$", re.I)
_IP_RE = re.compile(r"\b\d{1,3}(?:\.\d{1,3}){3}\b")
_DIGIT_RE = re.compile(r"\d")

_DATE_RE = re.compile(
    r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}"
    r"|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?,?\s+\d{4}"
    r"|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b",
    re.I,
)
_EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.]+\b")
_PHONE_RE = re.compile(r"(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)")
_AADHAAR_RE = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")
_LONG_DIGITS_RE = re.compile(r"\b\d{9,}\b")
_APPLICATION_ID_RE = re.compile(r"\b[A-Z]{1,4}\d{6,12}\b")

# Values that are field labels, options or placeholders rather than real data.
_STOP_VALUES = {
    "not available", "na", "n/a", "nil", "none", "not applicable", "-", "--",
    "yes", "no", "male", "female", "transgender", "general", "reserved", "obc",
    "sbc", "sc", "st", "vj", "ews", "open", "unmarried", "married", "divorced",
    "full time", "part time", "regular", "distance", "indian", "english",
    "hindi", "marathi", "sanskrit", "urdu", "dob", "name", "date", "gender",
    "nationality", "category", "religion", "mother tongue",
}

# Value shapes that are prose, not a single field value.
_MAX_VALUE_WORDS = 5
_REJECT_VALUE_RE = re.compile(
    r"candidate|marks? obtained|examination|passed|appearing|graduation|"
    r"shall|verify|check|the\s|which|and/or|^\W*$",
    re.I,
)

_MAX_PER_TYPE = 4


def _clean(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip(" :-–.,;\"'")


def _letters_only(value: str) -> str:
    return re.sub(r"[^A-Za-z]", "", value or "")


def _type_for(label: str):
    low = (label or "").lower()
    for pattern, etype in _LABEL_TYPES:
        if re.search(pattern, low):
            return etype
    return None


def _valid(value: str, etype: str) -> bool:
    v = _clean(value)
    if len(v) < 2 or len(v) > 80:
        return False
    if v.lower() in _STOP_VALUES:
        return False
    if len(v.split()) > _MAX_VALUE_WORDS:
        return False
    if _REJECT_VALUE_RE.search(v):
        return False
    if _PLACEHOLDER_RE.match(_letters_only(v)) or _IP_RE.search(v):
        return False
    if re.fullmatch(r"[\W_]+", v):
        return False
    # Every identifier carries digits; a value without any is a label, not data.
    if etype == "ID" and not _DIGIT_RE.search(v):
        return False
    if etype == "PERSON" and _DIGIT_RE.search(v):
        return False
    return True


class _Collector:
    def __init__(self):
        self.items: List[Dict] = []
        self.seen = set()

    def add(self, etype: str, value: str, page=None) -> None:
        v = _clean(value)
        if not _valid(v, etype):
            return
        key = (etype, v.lower())
        if key in self.seen:
            return
        if sum(1 for i in self.items if i["type"] == etype) >= _MAX_PER_TYPE:
            return
        self.seen.add(key)
        item = {"type": etype, "value": v}
        if page is not None:
            item["page"] = page
        self.items.append(item)


def _label_lines(text: str):
    """Yield (label, value) pairs for both inline and next-line layouts."""
    lines = [_clean(l) for l in text.splitlines()]
    lines = [l for l in lines if l]

    for idx, line in enumerate(lines):
        # Label with its value on the same line: "Application ID : MC25106763"
        m = _INLINE_SEP_RE.match(line)
        if m and not _NOTE_RE.search(m.group("label")):
            etype = _type_for(m.group("label"))
            if etype:
                yield etype, m.group("inline")
            continue

        # Bare label line whose value is the next line.
        if len(line) <= 70 and not line.endswith(".") and not _NOTE_RE.search(line):
            etype = _type_for(line)
            if etype and idx + 1 < len(lines):
                nxt = lines[idx + 1]
                # The next line must be a value, not another label.
                if not _type_for(nxt) and not _INLINE_SEP_RE.match(nxt):
                    yield etype, nxt


def extract_entities(text: str, page: int = None) -> List[Dict]:
    """Return deduplicated entities found in `text`."""
    col = _Collector()
    if not text or not text.strip():
        return col.items

    for etype, value in _label_lines(text):
        col.add(etype, value, page)

    for m in _DATE_RE.finditer(text):
        col.add("DATE", m.group(0), page)
    for m in _EMAIL_RE.finditer(text):
        col.add("EMAIL", m.group(0), page)
    for m in _PHONE_RE.finditer(text):
        col.add("PHONE", m.group(0), page)
    for m in _APPLICATION_ID_RE.finditer(text):
        col.add("ID", m.group(0), page)
    for m in _AADHAAR_RE.finditer(text):
        col.add("ID", m.group(0), page)
    for m in _LONG_DIGITS_RE.finditer(text):
        col.add("ID", m.group(0), page)

    return col.items


def entities_from_pages(pages: List[Dict]) -> List[Dict]:
    """Merge entities across `[{page, text}, ...]`, keeping the first page seen."""
    merged: List[Dict] = []
    seen = set()
    for entry in pages:
        for ent in extract_entities(entry.get("text", ""), page=entry.get("page")):
            key = (ent["type"], ent["value"].lower())
            if key in seen:
                continue
            seen.add(key)
            merged.append(ent)
    return merged
