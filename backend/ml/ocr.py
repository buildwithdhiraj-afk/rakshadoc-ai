"""Text extraction for document pages.

Extraction is attempted in order of fidelity and never fabricates content:

1. **PDF text layer** (`fitz`) — exact text for born-digital documents. This is
   not OCR guessing: the characters are the ones stored in the file.
2. **Tesseract** via `pytesseract`, when the binary is installed — real OCR for
   scans and photos. Set `TESSERACT_CMD` if it is not on `PATH`.
3. **Nothing found** — `source: "none"` with empty text, so the UI reports the
   page has no extractable text instead of showing a simulated result.

`source` is one of `pdf_text_layer`, `tesseract` or `none`.
"""

import logging
import os
import re
from typing import Optional

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

# Devanagari (Hindi/Marathi/Nepali/Sanskrit) block plus common punctuation.
_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
_ALPHA_RE = re.compile(r"[A-Za-z]")
_WHITESPACE_RE = re.compile(r"[ \t\u00a0]+")

# Only alphabet-ish text counts as a usable page.
_MIN_TEXT_CHARS = 8

_TESSERACT_LANG_MAP = {
    "hindi": "hin+eng",
    "marathi": "mar+eng",
    "english": "eng",
}

_tesseract_state: dict = {}

# Devanagari traineddata cannot be written to the Program Files tessdata folder
# without admin rights, so the repo ships its own read-only copy in backend/
# tessdata. When that directory exists, TESSDATA_PREFIX is pointed at it, which
# makes Hindi/Marathi work without touching the system install. Absent the
# directory nothing is set and the system tessdata folder stays authoritative.
_LOCAL_TESSDATA = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tessdata"
)

# Standard install roots, so a server started before Tesseract was installed
# still finds it. `TESSERACT_CMD` always wins when set.
_TESSERACT_CANDIDATES = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    "/usr/local/bin/tesseract",
    "/opt/homebrew/bin/tesseract",
)


def _looks_like_pdf(path: str) -> bool:
    try:
        with open(path, "rb") as f:
            return f.read(5) == b"%PDF-"
    except OSError:
        return False


def detect_language(text: str, default: str = "English") -> tuple:
    """Return (language, confidence) from the script mix of `text`."""
    stripped = (text or "").strip()
    if not stripped:
        return default, 0.0

    devanagari = len(_DEVANAGARI_RE.findall(stripped))
    latin = len(_ALPHA_RE.findall(stripped))
    total = devanagari + latin
    if total == 0:
        return default, 0.0

    if devanagari > latin:
        share = devanagari / total
        return "Hindi", round(min(0.99, 0.5 + share / 2), 3)
    share = latin / total
    return "English", round(min(0.99, 0.5 + share / 2), 3)


def _paragraphs(text: str) -> list:
    """Split a text layer into paragraph-sized chunks, dropping blanks."""
    chunks = []
    for block in re.split(r"\n\s*\n+", text or ""):
        lines = [_WHITESPACE_RE.sub(" ", line).strip() for line in block.splitlines()]
        joined = " ".join(line for line in lines if line)
        if joined:
            chunks.append(joined)
    return chunks


def _result(text: str, source: str, language: Optional[str] = None) -> dict:
    text = (text or "").strip()
    detected, confidence = detect_language(text, default=language or "English")
    if language and detected != language:
        # Caller asked for a specific language; keep it but report real confidence.
        confidence = round(min(confidence, 0.9), 3)
    paragraphs = _paragraphs(text)
    return {
        "language": language or detected,
        "language_confidence": confidence,
        "source": source,
        "text": text,
        "structured": {"paragraphs": paragraphs},
    }


def _tesseract_cmd() -> Optional[str]:
    """Resolve the Tesseract executable, or None when it is not installed.

    Returns the executable path. The version is deliberately not returned:
    `pytesseract.get_tesseract_version()` yields a `Version` object, so callers
    must never compare it to a number.
    """
    configured = os.environ.get("TESSERACT_CMD")
    if configured:
        return configured
    if "path" in _tesseract_state:
        return _tesseract_state["path"]

    path = None
    try:
        import pytesseract

        # A freshly installed Tesseract is on PATH for new shells only, so a
        # long-running server would miss it. Check the usual install roots too.
        for candidate in _TESSERACT_CANDIDATES:
            if os.path.isfile(candidate):
                pytesseract.pytesseract.tesseract_cmd = candidate
                path = candidate
                break

        if path is None:
            pytesseract.get_tesseract_version()
            path = pytesseract.pytesseract.tesseract_cmd
    except Exception as exc:
        logger.debug("Tesseract not available: %s", exc)
        path = None

    _tesseract_state["path"] = path
    return path


def _tessdata_dir() -> str:
    """Absolute local traineddata directory, or "" when there is none.

    TESSDATA_PREFIX is exported rather than --tessdata-dir because pytesseract
    passes `config` through shlex.split, which breaks on the spaces in this
    repo's path. Tesseract accepts the directory itself as the prefix, so the
    local copy takes over entirely and still finds eng.
    """
    if os.path.isdir(_LOCAL_TESSDATA):
        return os.path.abspath(_LOCAL_TESSDATA)
    return ""


def tesseract_available() -> bool:
    return _tesseract_cmd() is not None


def _available_languages() -> set:
    """Traineddata languages Tesseract can actually load, local copy included."""
    import pytesseract

    # Resolving first sets pytesseract.tesseract_cmd when Tesseract is not on
    # PATH, which get_languages() below depends on. The prefix is exported for
    # the same reason: get_languages() shells out to the real binary.
    if _tesseract_cmd() is None:
        return set()
    local = _tessdata_dir()
    if local:
        os.environ["TESSDATA_PREFIX"] = local
    try:
        langs = set(pytesseract.get_languages(config=""))
    except Exception as exc:
        logger.debug("Could not enumerate Tesseract languages: %s", exc)
        langs = set()
    if os.path.isdir(_LOCAL_TESSDATA):
        try:
            for name in os.listdir(_LOCAL_TESSDATA):
                if name.endswith(".traineddata"):
                    langs.add(name[: -len(".traineddata")])
        except OSError as exc:
            logger.debug("Could not read local tessdata dir: %s", exc)
    return langs


def _detect_language(text: str) -> str:
    """Name the script of `text` using the label Tesseract already reports."""
    if text and _DEVANAGARI_RE.search(text):
        return "Hindi"
    return "English"


def _extract_from_image(image_path: str, language: Optional[str]) -> Optional[str]:
    cmd = _tesseract_cmd()
    if not cmd or not image_path or not os.path.exists(image_path):
        return None
    try:
        import pytesseract
        from PIL import Image

        # Set before get_languages()/OCR so both resolve against the same copy.
        local = _tessdata_dir()
        if local:
            os.environ["TESSDATA_PREFIX"] = local

        available = _available_languages()
        requested = (language or "").strip().lower()
        if requested:
            lang = _TESSERACT_LANG_MAP.get(requested, "eng")
        else:
            # No language given: read Latin and Devanagari together. This app's
            # domain is Indian administrative records, which are routinely
            # bilingual, and single-script OCR loses whichever half it cannot model.
            lang = "eng"
            for candidate in ("mar", "hin"):
                if candidate in available:
                    lang = f"{candidate}+eng"
                    break
        if lang.split("+")[0] not in available:
            logger.info("OCR language %r unavailable, falling back to English", lang)
            lang = "eng"
        with Image.open(image_path) as img:
            return pytesseract.image_to_string(img.convert("RGB"), lang=lang)
    except Exception as exc:
        # Logged rather than swallowed: a silent None here looks identical to
        # "this image has no text", which hides genuine OCR failures.
        logger.warning("Tesseract failed on %s: %s", image_path, exc)
        return None


def _extract_pdf_page(pdf_path: str, page_no: int) -> Optional[str]:
    if not pdf_path or not os.path.exists(pdf_path) or not _looks_like_pdf(pdf_path):
        return None
    try:
        with fitz.open(pdf_path) as pdf:
            if page_no < 1 or page_no > pdf.page_count:
                return None
            return pdf[page_no - 1].get_text("text")
    except Exception:
        return None


def extract_text(
    image_path: str = None,
    language: str = None,
    pdf_path: str = None,
    page_no: int = 1,
) -> dict:
    """Extract text for one document page.

    Prefers the PDF text layer, falls back to Tesseract for rasterised pages,
    and reports `source: "none"` when neither yields usable text.

    `language` is optional: when omitted the script is detected automatically,
    because Tesseract trains a separate model per script and reading a bilingual
    Devanagari record as pure "eng" silently drops every non-Latin glyph.
    """
    layer_text = _extract_pdf_page(pdf_path, page_no)
    if layer_text and len(layer_text.strip()) >= _MIN_TEXT_CHARS:
        return _result(layer_text, "pdf_text_layer", language=language or "English")

    ocr_text = _extract_from_image(image_path, language)
    if ocr_text and len(ocr_text.strip()) >= _MIN_TEXT_CHARS:
        return _result(ocr_text, "tesseract", language=language or _detect_language(ocr_text))

    return _result(layer_text or "", "none", language=language or "English")
