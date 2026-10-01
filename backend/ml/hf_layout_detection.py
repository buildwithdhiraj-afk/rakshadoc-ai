"""Optional pretrained layout refinement backed by a Hugging Face model.

The PDF text layer in `ml.pdf_layout_detection` is authoritative: it yields
glyph-accurate boxes from the document's own content stream. This module only
*adds* structure the rules cannot see, and is strictly additive:

  * It never replaces or moves an existing detection.
  * It never downgrades or re-labels a text-layer detection.
  * It is disabled unless explicitly enabled, and any failure (missing package,
    missing weights, no network, timeout) degrades silently to "no additions".

That makes the model a fail-safe supplement rather than a dependency. The
default detection path does not import torch or transformers.

Model: `Aryn/deformable-detr-DocLayNet` (Deformable DETR fine-tuned on
DocLayNet). DocLayNet's label set maps onto the frontend DetectionCategory
enum without inventing categories.
"""
import logging
import os
import threading
from typing import Dict, List, Optional

log = logging.getLogger(__name__)

# Explicit opt-in: an unset or falsy value keeps the model entirely dormant.
MODEL_ID = os.environ.get("RAKSHADOC_HF_LAYOUT_MODEL", "Aryn/deformable-detr-DocLayNet")
ENABLED = os.environ.get("RAKSHADOC_ENABLE_HF_LAYOUT", "").strip().lower() in (
    "1", "true", "yes", "on",
)
SCORE_THRESHOLD = float(os.environ.get("RAKSHADOC_HF_LAYOUT_THRESHOLD", "0.35"))

# DocLayNet label -> DetectionCategory. Only categories that exist in
# ml.document_detection.SENSITIVITY_ACTION are mapped.
_LABEL_MAP = {
    "Title": "title",
    "Section-header": "heading",
    "Caption": "paragraph",
    "Text": "paragraph",
    "List-item": "list",
    "Table": "table",
    "Formula": "paragraph",
    "Footnote": "paragraph",
    "Page-header": "title",
    "Page-footer": "paragraph",
    "Picture": "figure",
}

_lock = threading.Lock()
_model = None
_processor = None
_load_failed = False


def is_enabled() -> bool:
    """True when the opt-in flag is set and the runtime can load the model."""
    return bool(ENABLED)


def _load():
    """Load and cache the model. Returns False on any failure, once per process."""
    global _model, _processor, _load_failed
    if _model is not None:
        return True
    if _load_failed:
        return False
    with _lock:
        if _model is not None:
            return True
        if _load_failed:
            return False
        try:
            import torch  # noqa: F401  (import check only)
            from transformers import AutoImageProcessor, AutoModelForObjectDetection
        except Exception as exc:
            log.info("HF layout disabled: runtime packages unavailable (%s)", exc)
            _load_failed = True
            return False
        try:
            _processor = AutoImageProcessor.from_pretrained(MODEL_ID)
            _model = AutoModelForObjectDetection.from_pretrained(MODEL_ID)
            _model.eval()
        except Exception as exc:
            log.info("HF layout disabled: could not load %s (%s)", MODEL_ID, exc)
            _load_failed = True
            return False
    return True


def refine_page(page_image, existing: List[Dict]) -> List[Dict]:
    """Return extra normalized detections for regions no rule already covers.

    `page_image` is the rendered BGR page the frontend displays, so normalized
    coordinates land on exactly those pixels. `existing` detections are never
    modified; a candidate is dropped when it substantially overlaps one.
    """
    if not ENABLED or not _load() or page_image is None:
        return []
    try:
        import numpy as np
        import torch
        from PIL import Image

        rgb = cv_rgb(page_image)
        img = Image.fromarray(rgb)
        with _lock:
            inputs = _processor(images=img, return_tensors="pt")
            outputs = _model(**inputs)
            target = torch.tensor([[img.height, img.width]])
            results = _processor.post_process_object_detection(
                outputs, target_sizes=target, threshold=SCORE_THRESHOLD
            )[0]

        width, height = float(img.width), float(img.height)
        if not width or not height:
            return []

        added: List[Dict] = []
        for score, label, box in zip(
            results["scores"].tolist(),
            results["labels"].tolist(),
            results["boxes"].tolist(),
        ):
            category = _LABEL_MAP.get(_model.config.id2label.get(label, ""))
            if not category:
                continue
            x0, y0, x1, y1 = box
            cand = {
                "category": category,
                "bbox": {
                    "x": max(0.0, x0 / width),
                    "y": max(0.0, y0 / height),
                    "w": min(1.0, (x1 - x0) / width),
                    "h": min(1.0, (y1 - y0) / height),
                },
                "confidence": round(float(score) * 0.9, 2),
            }
            # Additive only: never duplicate or displace rule-based content.
            if any(_overlaps(cand["bbox"], d["bbox"]) for d in existing):
                continue
            if any(_overlaps(cand["bbox"], d["bbox"]) for d in added):
                continue
            added.append(cand)
        return added
    except Exception as exc:
        log.info("HF layout refinement failed, continuing without it: %s", exc)
        return []


def cv_rgb(bgr_image) -> "np.ndarray":
    """BGR (OpenCV) -> RGB (PIL), without importing cv2 at module scope."""
    return bgr_image[:, :, ::-1].copy()


def _overlaps(a: Dict[str, float], b: Dict[str, float], tol: float = 0.25) -> bool:
    """Intersection over the smaller box: catches containment, not just overlap."""
    ax0, ay0, ax1, ay1 = a["x"], a["y"], a["x"] + a["w"], a["y"] + a["h"]
    bx0, by0, bx1, by1 = b["x"], b["y"], b["x"] + b["w"], b["y"] + b["h"]
    ix0, iy0 = max(ax0, bx0), max(ay0, by0)
    ix1, iy1 = min(ax1, bx1), min(ay1, by1)
    if ix1 <= ix0 or iy1 <= iy0:
        return False
    inter = (ix1 - ix0) * (iy1 - iy0)
    smaller = min(a["w"] * a["h"], b["w"] * b["h"])
    return smaller > 0 and (inter / smaller) > tol
