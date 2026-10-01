"""Visual overlay verification (the brief's final requirement).

Builds a realistic letter with KNOWN element positions, pushes it through the
live API (upload -> process -> detections + preview), then draws the returned
bounding boxes onto the preview image so they can be inspected visually.

Outputs:  <TEMP>/rakshadoc-overlay/overlay_letter.png   (boxes drawn)
          <TEMP>/rakshadoc-overlay/overlay_sample.png   (demo sample boxes)
"""
import io
import math
import os
import sys
import time

import cv2
import httpx
import numpy as np
from PIL import Image, ImageDraw, ImageFont

API = os.environ.get("RAKSHADOC_API", "http://localhost:8000/api")
OUT = os.path.join(os.environ.get("TEMP", "."), "rakshadoc-overlay")
os.makedirs(OUT, exist_ok=True)

COLORS = {
    "title": (59, 130, 246),
    "paragraph": (107, 114, 128),
    "table": (34, 197, 94),
    "signature": (239, 68, 68),
    "stamp": (249, 115, 22),
    "qr_code": (168, 85, 247),
    "heading": (96, 165, 250),
    "figure": (16, 185, 129),
    "list": (100, 116, 139),
}


def build_letter(path: str) -> dict:
    """Draw a realistic letter; return ground-truth boxes {cat: (x0,y0,x1,y1)}."""
    W, H = 1000, 1400
    img = Image.new("RGB", (W, H), "#ffffff")
    d = ImageDraw.Draw(img)
    fb = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 40)
    fh = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 24)
    fr = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18)
    fs = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 15)
    gt = {}

    # --- Title (big top line -> line-height rule) ---
    d.text((80, 60), "OFFER OF ADMISSION", fill="#111827", font=fb)
    gt["title"] = tuple(d.textbbox((80, 60), "OFFER OF ADMISSION", font=fb))

    # --- Paragraph body ---
    lines = [
        "Dear Candidate,",
        "We are pleased to inform you that your application has been accepted",
        "by the admissions committee. Please find below the details of your",
        "programme, fee structure and reporting date for the new session.",
        "Kindly confirm your acceptance within fifteen days of receipt of",
        "this letter via the student portal. Regards, Registrar Office.",
    ]
    y, rects = 170, []
    for ln in lines:
        d.text((80, y), ln, fill="#1f2937", font=fr)
        rects.append(d.textbbox((80, y), ln, font=fr))
        y += 34
    gt["paragraph"] = (min(r[0] for r in rects), min(r[1] for r in rects),
                       max(r[2] for r in rects), max(r[3] for r in rects))

    # --- Table with ruled grid ---
    tx0, ty0, tx1, ty1 = 70, 420, 930, 640
    d.rectangle([tx0, ty0, tx1, ty1], outline="#374151", fill="#f9fafb", width=2)
    for cx in (300, 540, 760):
        d.line([(cx, ty0), (cx, ty1)], fill="#374151", width=2)
    for ry in (ty0 + 44, ty0 + 99, ty0 + 154):
        d.line([(tx0, ry), (tx1, ry)], fill="#374151", width=2)
    d.text((85, ty0 + 12), "Item", fill="#111827", font=fh)
    d.text((320, ty0 + 12), "Duration", fill="#111827", font=fh)
    d.text((560, ty0 + 12), "Fee (INR)", fill="#111827", font=fh)
    ry = ty0 + 58
    for row in (("MCA", "2 Years", "120000"), ("DCA", "1 Year", "60000")):
        d.text((85, ry), row[0], fill="#1f2937", font=fr)
        d.text((320, ry), row[1], fill="#1f2937", font=fr)
        d.text((560, ry), row[2], fill="#1f2937", font=fr)
        ry += 55
    gt["table"] = (tx0, ty0, tx1, ty1)

    # --- Signature squiggle + rule ---
    pts = [(110 + i * 14, 905 + int(20 * math.sin(i * 1.15))) for i in range(17)]
    d.line(pts, fill="#1e3a8a", width=3)
    d.line([(95, 945), (350, 945)], fill="#6b7280", width=1)
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    gt["signature"] = (min(xs) - 6, min(ys) - 8, max(xs) + 6, max(ys) + 8)

    # --- Round stamp (red ring) ---
    sx0, sy0, sx1, sy1 = 660, 820, 880, 1040
    d.ellipse([sx0, sy0, sx1, sy1], outline="#dc2626", width=6)
    d.ellipse([sx0 + 24, sy0 + 24, sx1 - 24, sy1 - 24], outline="#dc2626", width=3)
    d.text((720, 920), "APPROVED", fill="#dc2626", font=fs)
    gt["stamp"] = (sx0, sy0, sx1, sy1)

    # --- REAL QR code (encoded, decodable) ---
    qr = cv2.QRCodeEncoder_create().encode("https://rakshadoc.ai/verify/T123")
    qr = (qr.astype(np.uint8) * 255) if qr.max() <= 1 else qr.astype(np.uint8)
    up = cv2.resize(qr, (170, 170), interpolation=cv2.INTER_NEAREST)
    canvas = np.full((210, 210, 3), 255, dtype=np.uint8)
    canvas[20:190, 20:190] = cv2.cvtColor(up, cv2.COLOR_GRAY2BGR)
    qx, qy = 720, 1120
    img.paste(Image.fromarray(canvas), (qx, qy))
    gt["qr_code"] = (qx + 20, qy + 20, qx + 190, qy + 190)

    img.save(path, "PNG")
    return gt


def iou(a, b):
    ax2, ay2 = a[0] + a[2], a[1] + a[3]
    bx2, by2 = b[0] + b[2], b[1] + b[3]
    ix = max(0.0, min(ax2, bx2) - max(a[0], b[0]))
    iy = max(0.0, min(ay2, by2) - max(a[1], b[1]))
    inter = ix * iy
    return inter / (a[2] * a[3] + b[2] * b[3] - inter) if inter else 0.0


def draw_overlay(preview_bytes: bytes, dets: list, out_path: str, label: str):
    img = Image.open(io.BytesIO(preview_bytes)).convert("RGB")
    W, H = img.size
    d = ImageDraw.Draw(img)
    fnt = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 16)
    print(f"\n{label}: preview {W}x{H}, {len(dets)} detections")
    for det in sorted(dets, key=lambda x: x["bbox"]["y"]):
        b = det["bbox"]
        x0, y0 = b["x"] * W, b["y"] * H
        x1, y1 = (b["x"] + b["w"]) * W, (b["y"] + b["h"]) * H
        c = COLORS.get(det["category"], (59, 130, 246))
        d.rectangle([x0, y0, x1, y1], outline=c, width=3)
        text = f"{det['category']} {int(det['confidence']*100)}%"
        tb = d.textbbox((0, 0), text, font=fnt)
        tw, th = tb[2] - tb[0], tb[3] - tb[1]
        ly = y0 - th - 8 if y0 - th - 8 > 0 else y1 + 4
        d.rectangle([x0, ly, x0 + tw + 10, ly + th + 8], fill=c)
        d.text((x0 + 5, ly + 3), text, fill="white", font=fnt)
        px = (x1 - x0) * (y1 - y0)
        print(f"  {det['category']:10s} px=({x0:6.0f},{y0:6.0f})-({x1:6.0f},{y1:6.0f}) "
              f"conf={det['confidence']} area={px:.0f}")
    img.save(out_path)


# ================================================================ run
base_name = f"viz_{int(time.time())}"
http = httpx.Client(timeout=60)

r = http.post(f"{API}/auth/register",
              json={"email": f"{base_name}@visual-check.com", "password": "VizTest!234",
                    "full_name": "Visual Overlay Test"})
token = r.json().get("token") if r.status_code == 200 else None
if not token:
    r = http.post(f"{API}/auth/login",
                  json={"email": f"{base_name}@visual-check.com", "password": "VizTest!234"})
    token = r.json().get("token")
H = {"Authorization": f"Bearer {token}"}
print("auth:", "ok" if token else "FAILED")
if not token:
    sys.exit(1)

# ---- Test A: realistic letter with known positions ----
letter_path = os.path.join(OUT, "letter_src.png")
gt = build_letter(letter_path)
print("ground truth (px):", {k: v for k, v in gt.items()})

with open(letter_path, "rb") as f:
    r = http.post(f"{API}/documents/upload", files={"file": ("offer_letter.png", f, "image/png")}, headers=H)
doc = r.json()
did = doc["id"]
print("uploaded:", r.status_code, did)

r = http.post(f"{API}/documents/{did}/process", headers=H)
print("processed:", r.status_code, r.json().get("status"))

dets = http.get(f"{API}/documents/{did}/detections", headers=H).json()
prev = http.get(f"{API}/documents/{did}/preview?page=1", headers=H)
draw_overlay(prev.content, dets, os.path.join(OUT, "overlay_letter.png"), "LETTER")

# score against ground truth
print("\nground-truth coverage (best IoU per expected element):")
ok_all = True
W, Hh = Image.open(letter_path).size
for cat, (a, b, c, e) in gt.items():
    gt_norm = (a / W, b / Hh, (c - a) / W, (e - b) / Hh)
    best, best_d = 0.0, None
    for d in dets:
        if d["category"] != cat:
            continue
        v = iou(gt_norm, (d["bbox"]["x"], d["bbox"]["y"], d["bbox"]["w"], d["bbox"]["h"]))
        if v > best:
            best, best_d = v, d
    hit = best >= 0.5
    ok_all &= hit
    print(f"  {cat:10s} best_iou={best:.2f} {'OK' if hit else 'MISS'}"
          + (f" conf={best_d['confidence']}" if best_d else " (no candidate)"))

print("\nLETTER RESULT:", "PASS" if ok_all and len(dets) >= 5 else "CHECK OUTPUT")

# ---- Test B: demo sample (known synthetic layout) ----
r = http.post(f"{API}/documents/demo-sample?sample_type=certificate", headers=H)
sid = r.json().get("id", "")
http.post(f"{API}/documents/{sid}/process", headers=H)
sdets = http.get(f"{API}/documents/{sid}/detections", headers=H).json()
sprev = http.get(f"{API}/documents/{sid}/preview?page=1", headers=H)
draw_overlay(sprev.content, sdets, os.path.join(OUT, "overlay_sample.png"), "DEMO SAMPLE")

print("\noverlays written to:", OUT)
