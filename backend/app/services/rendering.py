"""Render stored documents (PDF or image) into per-page PNG files.

The rendered page_N.png files are the single source of truth for:
- the document preview shown in the frontend,
- layout/component detection (bounding boxes are normalized to this image),
- protection/redaction output.

Rendering happens on demand (preview) and eagerly for the first pages
during processing. A page file is re-rendered when the source document
is newer than an existing render (stale/legacy files).
"""
import os
from typing import List, Optional, Tuple

import fitz  # PyMuPDF
from PIL import Image

from app.core.config import settings

# Target width for rasterized PDF pages (keeps aspect ratio).
PAGE_RENDER_WIDTH = 1200
# Cap on eagerly rendered/detected pages during processing.
MAX_EAGER_PAGES = 20


def pages_dir(doc_id: str) -> str:
    return os.path.join(settings.STORAGE_DIR, doc_id)


def _page_file(doc_id: str, page_no: int) -> str:
    return os.path.join(pages_dir(doc_id), f"page_{page_no}.png")


def _looks_like_pdf(path: str) -> bool:
    try:
        with open(path, "rb") as f:
            return f.read(5) == b"%PDF-"
    except OSError:
        return False


def _render_pdf_page(pdf_path: str, page_no: int, out_path: str) -> Optional[str]:
    try:
        with fitz.open(pdf_path) as pdf:
            if page_no < 1 or page_no > pdf.page_count:
                return None
            page = pdf[page_no - 1]
            rect = page.rect
            zoom = PAGE_RENDER_WIDTH / max(1.0, float(rect.width))
            pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
            pix.save(out_path)
            return out_path
    except Exception:
        return None


def _render_image_page(image_path: str, out_path: str) -> Optional[str]:
    try:
        with Image.open(image_path) as img:
            img.convert("RGB").save(out_path, "PNG")
        return out_path
    except Exception:
        return None


def ensure_page_rendered(doc, page_no: int, force: bool = False) -> Optional[str]:
    """Return the path of the rendered PNG for doc page `page_no`, rendering on demand.

    Returns None when the page cannot be produced (missing source, page out of range,
    unsupported content). Never fabricates placeholder content. `force=True`
    re-renders from the source even if a (possibly stale) page file exists.
    """
    if page_no < 1:
        return None
    out = _page_file(doc.id, page_no)
    src = doc.storage_path
    if not src or not os.path.exists(src):
        # Source gone: only reuse an existing render if present.
        return out if os.path.exists(out) else None

    if not force and os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
        return out

    os.makedirs(os.path.dirname(out), exist_ok=True)
    if _looks_like_pdf(src):
        return _render_pdf_page(src, page_no, out)
    # Single-page image upload.
    if page_no == 1:
        return _render_image_page(src, out)
    return None


def render_document_pages(doc, max_pages: int = MAX_EAGER_PAGES) -> List[Tuple[int, str]]:
    """Eagerly render pages 1..min(page_count, max_pages). Returns [(page_no, path)].

    Always re-renders from the source so re-processing replaces stale files."""
    total = max(1, min(int(doc.page_count or 1), max_pages))
    rendered: List[Tuple[int, str]] = []
    for p in range(1, total + 1):
        path = ensure_page_rendered(doc, p, force=True)
        if path:
            rendered.append((p, path))
    return rendered


def get_source_page_count(storage_path: str) -> int:
    """Actual page count of the stored file (PDF pages; images are 1)."""
    if not storage_path or not os.path.exists(storage_path):
        return 1
    if _looks_like_pdf(storage_path):
        try:
            with fitz.open(storage_path) as pdf:
                return max(1, pdf.page_count)
        except Exception:
            return 1
    return 1
