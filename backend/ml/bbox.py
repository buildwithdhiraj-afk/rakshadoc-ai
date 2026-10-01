"""Shared bounding-box validation for every detection pipeline.

Both the pixel (OpenCV) and text-layer (PyMuPDF) detectors emit normalized
boxes against the rendered page, so they must agree on what a valid box is.
Keeping the rule in one place prevents the two passes from disagreeing at the
merge step.
"""
import math

# A box smaller than this fraction of the page is noise, not content.
MIN_BBOX_FRACTION = 0.004


def sanitize_bbox(bbox) -> dict:
    """Validate + clamp a normalized bbox. Returns a clean dict or None.

    Rules: finite numbers, w>0, h>0, clamped into [0,1], x+w<=1, y+h<=1,
    minimum visible size (0.4% of the page).
    """
    if not isinstance(bbox, dict):
        return None
    try:
        x = float(bbox.get("x"))
        y = float(bbox.get("y"))
        bw = float(bbox.get("w"))
        bh = float(bbox.get("h"))
    except (TypeError, ValueError):
        return None
    if not all(math.isfinite(v) for v in (x, y, bw, bh)):
        return None
    if bw <= 0 or bh <= 0:
        return None
    x = min(max(x, 0.0), 1.0)
    y = min(max(y, 0.0), 1.0)
    bw = min(max(bw, 0.0), 1.0 - x)
    bh = min(max(bh, 0.0), 1.0 - y)
    if bw < MIN_BBOX_FRACTION or bh < MIN_BBOX_FRACTION:
        return None
    return {"x": round(x, 4), "y": round(y, 4), "w": round(bw, 4), "h": round(bh, 4)}


def iou(a: dict, b: dict) -> float:
    """Intersection-over-union of two normalized bboxes."""
    ax2, ay2 = a["x"] + a["w"], a["y"] + a["h"]
    bx2, by2 = b["x"] + b["w"], b["y"] + b["h"]
    ix = max(0.0, min(ax2, bx2) - max(a["x"], b["x"]))
    iy = max(0.0, min(ay2, by2) - max(a["y"], b["y"]))
    inter = ix * iy
    union = a["w"] * a["h"] + b["w"] * b["h"] - inter
    return inter / union if union > 0 else 0.0
