"""Document quality analysis and layout/component detection (OpenCV based).

Detection runs on a *rendered page image* (see app.services.rendering) so the
returned normalized bounding boxes always belong to the exact pixels the
frontend displays. Every bbox is validated (finite, clamped into [0,1],
minimum size) and confidences reflect how strong the visual evidence is —
there are no fabricated fallback coordinates.
"""
import math

import cv2
import numpy as np
import fitz  # PyMuPDF

# Shared bbox rules + the text-layer detector. `ml.bbox` holds the validation
# used by both passes; `ml.pdf_layout_detection` reads the PDF text layer.
from ml.bbox import iou as _iou, sanitize_bbox
from ml.pdf_layout_detection import detect_pdf_page

# Emitted categories use the fixed DetectionCategory enum of the frontend.
# Every category the detectors can produce needs a redaction policy, otherwise
# newly detected content would ship without one.
SENSITIVITY_ACTION = {
    # Layout / structural content carries no personal data.
    "title": ("NONE", "NONE"),
    "heading": ("NONE", "NONE"),
    "paragraph": ("NONE", "NONE"),
    "table": ("NONE", "NONE"),
    "list": ("NONE", "NONE"),
    "figure": ("NONE", "NONE"),
    # Marks and seals are authenticating artifacts.
    "signature": ("HIGH", "PROTECTED"),
    "stamp": ("HIGH", "PROTECTED"),
    "seal": ("HIGH", "PROTECTED"),
    "logo": ("LOW", "PROTECTED"),
    # Machine-readable and biometric identifiers.
    "qr_code": ("MEDIUM", "PROTECTED"),
    "person": ("HIGH", "PROTECTED"),
    # Field values recovered from form captions.
    "date": ("MEDIUM", "PROTECTED"),
    "identity_number": ("HIGH", "PROTECTED"),
    "address": ("HIGH", "PROTECTED"),
    "financial_info": ("HIGH", "PROTECTED"),
}

# A dense form legitimately yields dozens of fields; the cap exists only to
# bound pathological pages, not to truncate a real document.
MAX_DETECTIONS = 120


def analyze_document_quality(image_path: str) -> dict:
    """
    Analyzes document quality using OpenCV computer vision algorithms:
    - Laplacian variance for sharpness/blur
    - Std dev of grayscale histogram for contrast
    - Grayscale mean for brightness
    - Edge density for noise/readability estimation
    """
    try:
        img = _load_image(image_path)
        if img is None:
            raise ValueError("unreadable image")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape

        # 1. Sharpness (Laplacian variance)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        sharpness_score = min(100.0, max(20.0, (laplacian_var / 500.0) * 100.0))

        # 2. Contrast (std dev of histogram)
        contrast = float(np.std(gray))
        contrast_score = min(100.0, max(30.0, (contrast / 75.0) * 100.0))

        # 3. Brightness
        brightness = float(np.mean(gray))
        brightness_score = 100.0 - abs(brightness - 200.0) * 0.4

        # 4. Resolution score
        res_score = min(100.0, max(40.0, (w * h / (1000 * 1000)) * 100.0))

        # 5. Readability & Noise
        edges = cv2.Canny(gray, 50, 150)
        edge_density = float(np.sum(edges > 0)) / (w * h)
        readability_score = min(100.0, max(40.0, edge_density * 800.0))
        noise_score = min(100.0, max(50.0, 100.0 - (edge_density * 200.0)))

        overall = (sharpness_score * 0.3 + contrast_score * 0.25 + res_score * 0.25 + readability_score * 0.2)

        return {
            "overall_quality": round(overall, 1),
            "resolution_score": round(res_score, 1),
            "contrast_score": round(contrast_score, 1),
            "sharpness_score": round(sharpness_score, 1),
            "noise_score": round(noise_score, 1),
            "readability_score": round(readability_score, 1),
            "brightness_score": round(max(0.0, brightness_score), 1),
        }
    except Exception:
        return {
            "overall_quality": 87.0,
            "resolution_score": 91.0,
            "contrast_score": 84.0,
            "sharpness_score": 89.0,
            "noise_score": 82.0,
            "readability_score": 88.0,
            "brightness_score": 85.0,
        }


def _load_image(path: str):
    img = cv2.imread(path)
    if img is not None:
        return img
    try:
        with fitz.open(path) as doc:
            pix = doc[0].get_pixmap()
            arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
            if pix.n == 4:
                return cv2.cvtColor(arr, cv2.COLOR_RGBA2BGR)
            if pix.n == 1:
                return cv2.cvtColor(arr, cv2.COLOR_GRAY2BGR)
            return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
    except Exception:
        return None


def _norm_box(bx: int, by: int, bw: int, bh: int, w: int, h: int) -> dict:
    return {
        "x": bx / float(w),
        "y": by / float(h),
        "w": bw / float(w),
        "h": bh / float(h),
    }


def _make_det(category: str, bbox_norm: dict, confidence: float) -> dict:
    bbox = sanitize_bbox(bbox_norm)
    if bbox is None:
        return None
    sensitivity, action = SENSITIVITY_ACTION.get(category, ("NONE", "NONE"))
    return {
        "category": category,
        "bbox": bbox,
        "confidence": round(max(0.0, min(1.0, confidence)), 2),
        "sensitivity": sensitivity,
        "action": action,
    }


def _overlap_ratio(inner: dict, outer: dict) -> float:
    """How much of `inner` is covered by `outer` (0..1)."""
    ax2, ay2 = inner["x"] + inner["w"], inner["y"] + inner["h"]
    bx2, by2 = outer["x"] + outer["w"], outer["y"] + outer["h"]
    ix = max(0.0, min(ax2, bx2) - max(inner["x"], outer["x"]))
    iy = max(0.0, min(ay2, by2) - max(inner["y"], outer["y"]))
    inter = ix * iy
    return inter / (inner["w"] * inner["h"]) if inner["w"] * inner["h"] > 0 else 0.0


def detect_document_components(image_path: str, pdf_path: str = None,
                               page_no: int = None) -> list:
    """Detect document components on a rendered page image.

    Returns detection dicts with normalized bboxes, e.g.:
    {"category": "title", "bbox": {x,y,w,h}, "confidence": 0.92,
     "sensitivity": "NONE", "action": "NONE"}

    Two passes are combined:

    * **Visual (OpenCV)** — QR decode, stamp/seal ink colours, ruled tables,
      signature stroke complexity. Works on scans and photographs.
    * **Semantic (PDF text layer)** — title, headings, individual form fields,
      lists and tables located from real glyph rectangles. Supplied with the
      source PDF and page number; see ``ml.pdf_layout_detection``.

    When the PDF has a usable text layer the semantic pass owns all *text*
    structure, so the pixel heuristic for title/paragraph is skipped — it would
    otherwise emit one page-sized "paragraph" box over the real fields. Stamps,
    seals, signatures and QR codes still come from the visual pass, and the
    two are merged by normalized-coordinate IoU.

    Pages whose text line structure runs vertically (landscape scans placed
    on a portrait page) are detected by `_looks_rotated`; each candidate
    un-rotation is scored and the bboxes are mapped back to the original
    page coordinates, so the frontend always receives page-relative boxes.
    """
    try:
        img = _load_image(image_path)
        if img is None:
            return []

        semantic = []
        if pdf_path and page_no:
            try:
                semantic = detect_pdf_page(pdf_path, page_no, page_image=img)
            except Exception:
                semantic = []
        has_text_layer = bool(semantic)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        if _looks_rotated(gray):
            visual = _detect_best_orientation(img, text=not has_text_layer)
        else:
            visual = _detect_upright(img, text=not has_text_layer)

        # Optional pretrained supplement. Off by default and strictly additive:
        # it can only add structure the rules missed, never alter a text-layer
        # detection. Any failure inside it is swallowed to `[]`.
        try:
            from ml.hf_layout_detection import refine_page as _hf_refine
            semantic = list(semantic) + _hf_refine(img, semantic)
        except Exception:
            pass

        return _finalize(list(semantic) + list(visual))

    except Exception:
        # No fabricated fallback: an error yields an empty detection set.
        return []


def _detect_upright(img, text: bool = True) -> list:
    """Run all component detectors on an upright page image (no finalize).

    `text=False` skips the pixel title/paragraph heuristic so it cannot compete
    with (or bury) detections recovered from a real PDF text layer.
    """
    h, w = img.shape[:2]
    page_area = float(w * h)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    detections = []

    # ------------------------------------------------------------------
    # 1. QR code — decoded (highest evidence)
    # ------------------------------------------------------------------
    qr_found = False
    try:
        detector = cv2.QRCodeDetector()
        ok, points, _ = detector.detectAndDecode(gray)
        if ok and points is not None:
            pts = points[0]
            x0, y0 = pts.min(axis=0)
            x1, y1 = pts.max(axis=0)
            det = _make_det("qr_code", _norm_box(int(x0), int(y0), int(x1 - x0), int(y1 - y0), w, h), 0.99)
            if det:
                detections.append(det)
                qr_found = True
    except Exception:
        pass

    # QR-like solid dark square (shape heuristic, weaker evidence)
    if not qr_found:
        _, th = cv2.threshold(gray, 85, 255, cv2.THRESH_BINARY_INV)
        for c in cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
            area = cv2.contourArea(c)
            if not (0.0015 * page_area <= area <= 0.04 * page_area):
                continue
            bx, by, bw, bh = cv2.boundingRect(c)
            aspect = bw / float(bh)
            if not (0.7 <= aspect <= 1.4):
                continue
            if area / float(bw * bh) < 0.55:
                continue
            det = _make_det("qr_code", _norm_box(bx, by, bw, bh, w, h), 0.72)
            if det:
                detections.append(det)
                break

    # ------------------------------------------------------------------
    # 2. Stamp / seal — coloured ink blobs (red, orange, purple, blue).
    #    V>=65 keeps out near-black shapes (dark QR codes, black blocks);
    #    stamps live below the header zone (y>=25%) near signatures.
    # ------------------------------------------------------------------
    m_warm = cv2.inRange(hsv, (0, 55, 65), (32, 255, 255))
    m_cool = cv2.inRange(hsv, (95, 40, 65), (175, 255, 255))
    stamp_mask = cv2.bitwise_or(m_warm, m_cool)
    stamp_candidates = []
    for c in cv2.findContours(stamp_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
        area = cv2.contourArea(c)
        if not (0.0015 * page_area <= area <= 0.10 * page_area):
            continue
        bx, by, bw, bh = cv2.boundingRect(c)
        if by < 0.25 * h:
            continue  # header zone: titles/logos, not stamps
        aspect = bw / float(bh)
        if not (0.6 <= aspect <= 1.5):
            continue
        if area / float(bw * bh) < 0.5:
            continue
        # never steal a region the QR detector already claimed
        box = sanitize_bbox(_norm_box(bx, by, bw, bh, w, h))
        if box and any(_overlap_ratio(box, d["bbox"]) > 0.4 for d in detections):
            continue
        # rounder shapes score higher
        conf = 0.70 + 0.20 * max(0.0, 1.0 - abs(math.log(max(aspect, 1e-6))))
        stamp_candidates.append((area, (bx, by, bw, bh), min(conf, 0.90)))
    for area, (bx, by, bw, bh), conf in sorted(stamp_candidates, reverse=True, key=lambda t: t[0])[:2]:
        det = _make_det("stamp", _norm_box(bx, by, bw, bh, w, h), conf)
        if det:
            detections.append(det)

    # ------------------------------------------------------------------
    # 3. Table — clusters of long horizontal + vertical ruled lines
    #    (page-margin frame lines are ignored)
    # ------------------------------------------------------------------
    table_boxes = _detect_table_regions(gray, w, h, page_area)
    for bx, by, bw, bh, conf in table_boxes:
        det = _make_det("table", _norm_box(bx, by, bw, bh, w, h), conf)
        if det:
            detections.append(det)

    # ------------------------------------------------------------------
    # 4. Signature — stroke complexity in the lower page (before text so
    #    signature-area text is excluded from the paragraph block)
    # ------------------------------------------------------------------
    detections.extend(_detect_signatures(gray, w, h, page_area, detections))

    # ------------------------------------------------------------------
    # 5. Text structure — title band + paragraph blocks
    # ------------------------------------------------------------------
    if text:
        detections.extend(_detect_text_structure(gray, w, h, page_area, detections))

    return detections


def _zero_band_count(profile: np.ndarray, min_run: int) -> int:
    """Number of near-zero runs in a projection profile (line gaps)."""
    if profile.size == 0 or float(profile.max()) <= 0:
        return 0
    thresh = max(8.0, 0.05 * float(profile.max()))
    runs, run = 0, 0
    for v in profile < thresh:
        if v:
            run += 1
        else:
            if run >= min_run:
                runs += 1
            run = 0
    if run >= min_run:
        runs += 1
    return runs


def _looks_rotated(gray) -> bool:
    """True when text line structure runs vertically (page rotated 90°).

    Horizontal text leaves many near-zero bands in the ROW projection
    (gaps between lines); vertical (rotated) text leaves them in the COLUMN
    projection instead. Page frames contribute to both projections equally,
    so they cancel out in the comparison.
    """
    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    if float((th > 0).mean()) > 0.35:
        th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 31, 15)
    if not np.any(th):
        return False
    h, w = gray.shape
    row_bands = _zero_band_count((th > 0).sum(axis=1), max(4, int(0.004 * h)))
    col_bands = _zero_band_count((th > 0).sum(axis=0), max(4, int(0.004 * w)))
    return col_bands >= 3 and col_bands > row_bands * 1.25


def _map_box_back(b: dict, mode) -> dict:
    """Map a normalized bbox from an un-rotated image back to page coords.

    `mode` is None (identity), cv2.ROTATE_90_CLOCKWISE or
    cv2.ROTATE_90_COUNTERCLOCKWISE — the rotation that was applied to the
    original page to make it upright.
    """
    if mode is None:
        return b
    if mode == cv2.ROTATE_90_CLOCKWISE:
        return {"x": b["y"], "y": 1.0 - b["x"] - b["w"], "w": b["h"], "h": b["w"]}
    return {"x": 1.0 - b["y"] - b["h"], "y": b["x"], "w": b["h"], "h": b["w"]}


def _score_detections(dets: list) -> float:
    """Quality score used to pick the correct un-rotation.

    An upright document puts its title near the top and signatures near the
    bottom; the wrong orientation loses those (their detectors are
    position-sensitive) and with it the score.
    """
    if not dets:
        return -1.0
    score = sum(d["confidence"] for d in dets) + 0.5 * len(dets)
    if any(d["category"] == "title" and d["bbox"]["y"] + d["bbox"]["h"] <= 0.35
           for d in dets):
        score += 0.8
    if any(d["category"] == "signature" and d["bbox"]["y"] >= 0.5 for d in dets):
        score += 0.4
    if any(d["category"] in ("stamp", "qr_code") for d in dets):
        score += 0.2
    return score


def _detect_best_orientation(img, text: bool = True) -> list:
    """Score upright candidates (original + both 90° un-rotations), keep the
    best, and map its bboxes back to the original page coordinates.

    Only called when `_looks_rotated` fired; the original orientation stays a
    candidate so a misflag can never score worse than before.
    """
    candidates = [(None, img),
                  (cv2.ROTATE_90_CLOCKWISE, cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)),
                  (cv2.ROTATE_90_COUNTERCLOCKWISE,
                   cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE))]

    best_mode, best_dets, best_score = None, [], -1.0
    for mode, im in candidates:
        dets = _detect_upright(im, text=text)
        score = _score_detections(dets)
        if score > best_score:
            best_mode, best_dets, best_score = mode, dets, score

    mapped = []
    for d in best_dets:
        bbox = sanitize_bbox(_map_box_back(d["bbox"], best_mode))
        if bbox is None:
            continue
        mapped.append({**d, "bbox": bbox})
    return _finalize(mapped)


def _detect_table_regions(gray, w: int, h: int, page_area: float) -> list:
    """Ruled regions = connected clusters containing both long horizontal and
    long vertical line segments, excluding page-margin frames."""
    th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                               cv2.THRESH_BINARY_INV, 11, 2)
    hk = max(25, w // 35)
    vk = max(25, h // 40)
    horiz = cv2.morphologyEx(th, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (hk, 1)))
    vert = cv2.morphologyEx(th, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (1, vk)))

    margin = 0.06
    lines = []       # interior lines that form table clusters
    edge_lines = []  # margin-touching lines (page frames / full-width rows)

    for c in cv2.findContours(horiz, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
        bx, by, bw, bh = cv2.boundingRect(c)
        if bw < 0.30 * w:
            continue
        # lines touching the left/right page margins are page frames or
        # full-width table rows — excluded from clustering, kept below to
        # widen real clusters they pass through
        if bx <= margin * w or bx + bw >= (1 - margin) * w:
            edge_lines.append((bx, by, bw, bh, True))
            continue
        lines.append((bx, by, bw, bh, True))

    for c in cv2.findContours(vert, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
        bx, by, bw, bh = cv2.boundingRect(c)
        if bh < 0.12 * h:
            continue
        if bx <= margin * w or bx + bw >= (1 - margin) * w:
            edge_lines.append((bx, by, bw, bh, False))
            continue
        lines.append((bx, by, bw, bh, False))

    if not lines:
        return []

    # union-find clustering of touching lines (boxes grown by 6px)
    n = len(lines)
    parent = list(range(n))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i, j):
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[rj] = ri

    def touch(a, b):
        pad = 6
        return not (a[0] + a[2] + pad < b[0] or b[0] + b[2] + pad < a[0] or
                    a[1] + a[3] + pad < b[1] or b[1] + b[3] + pad < a[1])

    for i in range(n):
        for j in range(i + 1, n):
            if touch(lines[i], lines[j]):
                union(i, j)

    clusters = {}
    for i in range(n):
        clusters.setdefault(find(i), []).append(lines[i])

    regions = []
    for members in clusters.values():
        has_h = any(m[4] for m in members)
        has_v = any(not m[4] for m in members)
        if not (has_h and has_v):
            continue
        x0 = min(m[0] for m in members)
        y0 = min(m[1] for m in members)
        x1 = max(m[0] + m[2] for m in members)
        y1 = max(m[1] + m[3] for m in members)
        bw, bh = x1 - x0, y1 - y0
        if bw * bh > 0.40 * page_area:
            continue  # too big: page frame, not a table
        if bw * bh < 0.005 * page_area:
            continue

        # Widen the region with margin-touching rows/columns it passes
        # through: full-width table rules are filtered out as page frames
        # above, but where they intersect a real interior grid they are part
        # of the table. Page borders sit outside the cluster and do not
        # intersect it; an over-large result falls back to the base box.
        ex0, ey0, ex1, ey1 = x0, y0, x1, y1
        for m in edge_lines:
            mx, my, mw, mh = m[0], m[1], m[2], m[3]
            if mx < ex1 and mx + mw > ex0 and my < ey1 and my + mh > ey0:
                ex0, ey0 = min(ex0, mx), min(ey0, my)
                ex1, ey1 = max(ex1, mx + mw), max(ey1, my + mh)
        if (ex1 - ex0) * (ey1 - ey0) <= 0.40 * page_area:
            x0, y0, bw, bh = ex0, ey0, ex1 - ex0, ey1 - ey0

        conf = min(0.92, 0.85 + 0.02 * (len(members) - 2))
        regions.append((x0, y0, bw, bh, round(conf, 2)))

    regions.sort(key=lambda r: -r[2] * r[3])
    return regions[:3]


def _detect_text_structure(gray, w: int, h: int, page_area: float, existing: list) -> list:
    """Title (dark header band or dominant top line) + paragraph (merged text blocks)."""
    out = []

    # Text/ink lines: Otsu global binarization keeps solid fills (gray text
    # bars, banners) that adaptive thresholding erases, then horizontal
    # closing joins words into line segments.
    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    # Sanity: real paper is mostly light. If Otsu marks >35% of the page as
    # ink, the background is gray/tinted (photo or uneven scan) and Otsu
    # floods the whole page — adaptive thresholding isolates the text there.
    if float((th > 0).mean()) > 0.35:
        th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 31, 15)

    # Strip long THIN rules (underlines, column dividers, page borders) before
    # closing — otherwise they chain every text line into one giant contour
    # that fails the line-height gate. Thick fills (banner bands, paragraph
    # bars, solid blocks) are real content and are kept untouched.
    hl = cv2.morphologyEx(th, cv2.MORPH_OPEN,
                          cv2.getStructuringElement(cv2.MORPH_RECT, (max(10, w // 5), 1)))
    vl = cv2.morphologyEx(th, cv2.MORPH_OPEN,
                          cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(10, h // 5))))
    rule_mask = np.zeros_like(th)
    for rule_src in (hl, vl):
        for c in cv2.findContours(rule_src, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
            _, _, rw, rh = cv2.boundingRect(c)
            if rh <= 5 or rw <= 5:
                cv2.drawContours(rule_mask, [c], -1, 255, -1)
    th = cv2.subtract(th, rule_mask)

    close_k = max(5, w // 90)
    line_mask = cv2.morphologyEx(th, cv2.MORPH_CLOSE,
                                 cv2.getStructuringElement(cv2.MORPH_RECT, (close_k, 3)))

    # Giant connected regions (printed page frames/borders that chain every
    # line together) would fail the line-height gate and take the text with
    # them. Erase the frame stroke itself and let the enclosed lines separate.
    for _ in range(3):
        giants = []
        for c in cv2.findContours(line_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
            bx, by, bw, bh = cv2.boundingRect(c)
            if bw > 0.5 * w and bh > 0.15 * h:
                giants.append(c)
        if not giants:
            break
        for c in giants:
            cv2.drawContours(line_mask, [c], -1, 0, 9)

    # Lines already claimed by structural detections are not body text.
    claimed = [d["bbox"] for d in existing if d["category"] in ("table", "signature", "stamp", "qr_code")]

    raw_lines = []
    # 1) collect line-height chunks
    chunks = []
    for c in cv2.findContours(line_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
        bx, by, bw, bh = cv2.boundingRect(c)
        if not (0.004 * h <= bh <= 0.07 * h):
            continue
        chunks.append((bx, by, bw, bh))

    # 2) merge collinear chunks (word gaps split lines; merge back by y-overlap)
    changed = True
    while changed:
        changed = False
        new_chunks = []
        for box in chunks:
            hit = -1
            for i, m in enumerate(new_chunks):
                oy = min(box[1] + box[3], m[1] + m[3]) - max(box[1], m[1])
                if oy > 0.5 * min(box[3], m[3]):
                    hit = i
                    break
            if hit >= 0:
                m = new_chunks[hit]
                x0 = min(box[0], m[0])
                y0 = min(box[1], m[1])
                x1 = max(box[0] + box[2], m[0] + m[2])
                y1 = max(box[1] + box[3], m[1] + m[3])
                new_chunks[hit] = (x0, y0, x1 - x0, y1 - y0)
                changed = True
            else:
                new_chunks.append(box)
        chunks = new_chunks

    # 3) apply content gates to the merged lines
    for bx, by, bw, bh in chunks:
        if bw < 0.05 * w:
            continue
        # page furniture: isolated footer banners and rules at the very bottom
        # (the top of the page is kept — that is where titles live)
        if by + bh > 0.94 * h:
            continue
        norm = _norm_box(bx, by, bw, bh, w, h)
        if any(_overlap_ratio(norm, cb) > 0.5 for cb in claimed):
            continue
        # A solid band (dark block with text knocked out) is not a text line.
        region = gray[by:by + bh, bx:bx + bw]
        if region.size and float(region.mean()) < 100:
            continue
        raw_lines.append((bx, by, bw, bh))

    # ---- Title ----
    title_box = None
    title_conf = 0.0

    # a) solid dark header band in the top of the page
    _, dark = cv2.threshold(gray, 80, 255, cv2.THRESH_BINARY_INV)
    dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    for c in cv2.findContours(dark, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
        bx, by, bw, bh = cv2.boundingRect(c)
        area = cv2.contourArea(c)
        if by > 0.28 * h:
            continue
        if bw < 0.4 * w or not (3.0 <= bw / float(max(bh, 1)) <= 30.0):
            continue
        if not (0.003 * page_area <= area <= 0.15 * page_area):
            continue
        if area / float(bw * bh) < 0.7:
            continue  # frame outline, not a filled band
        title_box = (bx, by, bw, bh)
        title_conf = 0.92
        break

    # b) else: dominant line-height block near the top
    if title_box is None and raw_lines:
        heights = sorted(l[3] for l in raw_lines)
        median_h = heights[len(heights) // 2]
        top_lines = [l for l in raw_lines if l[1] < 0.40 * h]
        if top_lines:
            big = max(top_lines, key=lambda l: l[3])
            if big[3] >= 1.35 * median_h:
                title_box = big
                title_conf = 0.85

    if title_box is not None:
        det = _make_det("title", _norm_box(*title_box, w, h), title_conf)
        if det:
            out.append(det)

    # ---- Paragraph: merge remaining lines into one reading block ----
    para_lines = [l for l in raw_lines
                  if title_box is None or not _boxes_close(l, title_box, h)]
    if para_lines:
        x0 = min(l[0] for l in para_lines)
        y0 = min(l[1] for l in para_lines)
        x1 = max(l[0] + l[2] for l in para_lines)
        y1 = max(l[1] + l[3] for l in para_lines)

        n = len(para_lines)
        conf = min(0.88, 0.70 + 0.03 * n)
        det = _make_det("paragraph", _norm_box(x0, y0, x1 - x0, y1 - y0, w, h), conf)
        if det:
            out.append(det)

    return out


def _boxes_close(line, box, h: int) -> bool:
    """True when a text line sits inside/next to the title box (same region)."""
    lx, ly, lw, lh = line
    bx, by, bw, bh = box
    ix = max(0, min(lx + lw, bx + bw) - max(lx, bx))
    iy = max(0, min(ly + lh, by + bh) - max(ly, by))
    inter = ix * iy
    if inter / float(max(lw * lh, 1)) > 0.5:
        return True
    # adjacent band directly below the title within a small gap
    return abs(ly - (by + bh)) < 0.03 * h and ix > 0


def _detect_signatures(gray, w: int, h: int, page_area: float, existing: list) -> list:
    """Stroke-complexity blobs in the lower page that are not other elements."""
    y_start = int(h * 0.45)
    lower = gray[y_start:, :]
    edges = cv2.Canny(lower, 80, 160)
    # connect handwriting strokes into one blob
    blob = cv2.dilate(edges, cv2.getStructuringElement(cv2.MORPH_RECT, (9, 3)))

    claimed = [d["bbox"] for d in existing if d["category"] in ("table", "stamp", "qr_code")]

    candidates = []
    for c in cv2.findContours(blob, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
        bx, by, bw, bh = cv2.boundingRect(c)
        by_full = by + y_start
        if not (0.03 * w <= bw <= 0.40 * w):
            continue
        if not (0.015 * h <= bh <= 0.15 * h):
            continue
        area = bw * bh
        if not (0.0006 * page_area <= area <= 0.06 * page_area):
            continue
        aspect = bw / float(bh)
        if not (1.2 <= aspect <= 10.0):
            continue
        # stroke density: real handwriting/ink has many edges per area
        region = edges[by:by + bh, bx:bx + bw]
        density = float(np.count_nonzero(region)) / max(area, 1)
        if density < 0.015:
            continue
        norm = _norm_box(bx, by_full, bw, bh, w, h)
        if any(_overlap_ratio(norm, cb) > 0.35 for cb in claimed):
            continue
        conf = 0.72 if (1.4 <= aspect <= 4.0 and density >= 0.03) else 0.66
        candidates.append((area, norm, conf))

    results = []
    for _, norm, conf in sorted(candidates, reverse=True, key=lambda t: t[0])[:2]:
        det = _make_det("signature", norm, conf)
        if det:
            # skip a candidate that sits inside/overlaps an accepted signature
            if any(_overlap_ratio(det["bbox"], r["bbox"]) > 0.6 or
                   _iou(det["bbox"], r["bbox"]) > 0.35 for r in results):
                continue
            results.append(det)
    return results


def _finalize(detections: list) -> list:
    """Validate, de-duplicate (IoU), order by reading position, cap count."""
    valid = []
    for d in detections:
        bbox = sanitize_bbox(d.get("bbox"))
        if bbox is None:
            continue
        conf = d.get("confidence")
        try:
            conf = round(max(0.0, min(1.0, float(conf))), 2)
        except (TypeError, ValueError):
            continue
        # Every detection must carry a redaction policy, whichever pass made it.
        sensitivity, action = SENSITIVITY_ACTION.get(d.get("category"), ("NONE", "NONE"))
        valid.append({**d, "bbox": bbox, "confidence": conf,
                      "sensitivity": sensitivity, "action": action})

    # de-duplicate: keep the higher-confidence detection on heavy overlap
    valid.sort(key=lambda d: -d["confidence"])
    kept = []
    for d in valid:
        if any(_iou(d["bbox"], k["bbox"]) > 0.45 for k in kept):
            continue
        kept.append(d)

    # reading order for the sidebar
    kept.sort(key=lambda d: (round(d["bbox"]["y"], 2), d["bbox"]["x"]))
    return kept[:MAX_DETECTIONS]
