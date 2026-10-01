"""Live end-to-end demo against the running stack (backend :8000).

Flow: register -> upload letter (known element positions) -> AI Layout
detection -> draw overlay -> protect (redact signature+stamp) -> verify.
Writes demo artifacts to <TEMP>/rakshadoc-overlay/.
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

COLORS = {"title": (59, 130, 246), "paragraph": (107, 114, 128),
          "table": (34, 197, 94), "signature": (239, 68, 68),
          "stamp": (249, 115, 22), "qr_code": (168, 85, 247)}

def build_letter(path):
    W, H = 1000, 1400
    img = Image.new("RGB", (W, H), "#ffffff")
    d = ImageDraw.Draw(img)
    fb = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 40)
    fh = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 24)
    fr = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18)
    fs = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 15)
    d.text((80, 60), "OFFER OF ADMISSION", fill="#111827", font=fb)
    lines = ["Dear Candidate,",
             "We are pleased to inform you that your application has been accepted",
             "by the admissions committee. Please find below the details of your",
             "programme, fee structure and reporting date for the new session.",
             "Kindly confirm your acceptance within fifteen days of receipt of",
             "this letter via the student portal. Regards, Registrar Office."]
    y = 170
    for ln in lines:
        d.text((80, y), ln, fill="#1f2937", font=fr)
        y += 34
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
    pts = [(110 + i * 14, 905 + int(20 * math.sin(i * 1.15))) for i in range(17)]
    d.line(pts, fill="#1e3a8a", width=3)
    d.line([(95, 945), (350, 945)], fill="#6b7280", width=1)
    d.ellipse([660, 820, 880, 1040], outline="#dc2626", width=6)
    d.ellipse([684, 844, 856, 1016], outline="#dc2626", width=3)
    d.text((720, 920), "APPROVED", fill="#dc2626", font=fs)
    qr = cv2.QRCodeEncoder_create().encode("https://rakshadoc.ai/verify/LIVE-DEMO")
    qr = (qr.astype(np.uint8) * 255) if qr.max() <= 1 else qr.astype(np.uint8)
    up = cv2.resize(qr, (170, 170), interpolation=cv2.INTER_NEAREST)
    canvas = np.full((210, 210, 3), 255, dtype=np.uint8)
    canvas[20:190, 20:190] = cv2.cvtColor(up, cv2.COLOR_GRAY2BGR)
    img.paste(Image.fromarray(canvas), (720, 1120))
    img.save(path, "PNG")

def draw_boxes(img_bytes, dets, out_path):
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    W, H = img.size
    d = ImageDraw.Draw(img)
    fnt = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 16)
    for det in sorted(dets, key=lambda x: x["bbox"]["y"]):
        b = det["bbox"]
        x0, y0, x1, y1 = b["x"] * W, b["y"] * H, (b["x"] + b["w"]) * W, (b["y"] + b["h"]) * H
        c = COLORS.get(det["category"], (59, 130, 246))
        d.rectangle([x0, y0, x1, y1], outline=c, width=3)
        t = f"{det['category']} {int(det['confidence']*100)}%"
        tb = d.textbbox((0, 0), t, font=fnt)
        tw, th = tb[2] - tb[0], tb[3] - tb[1]
        ly = y0 - th - 8 if y0 - th - 8 > 0 else y1 + 4
        d.rectangle([x0, ly, x0 + tw + 10, ly + th + 8], fill=c)
        d.text((x0 + 5, ly + 3), t, fill="white", font=fnt)
    img.save(out_path)

# ---------------- live flow ----------------
http = httpx.Client(timeout=60)
stamp = int(time.time())
email = f"live_demo_{stamp}@rakshadoc.ai"
r = http.post(f"{API}/auth/register", json={"email": email, "password": "LiveDemo!234", "full_name": "Live Demo"})
token = r.json().get("token")
H = {"Authorization": f"Bearer {token}"}
print(f"[1] account created: {email}")

letter = os.path.join(OUT, "live_letter_src.png")
build_letter(letter)
with open(letter, "rb") as f:
    doc = http.post(f"{API}/documents/upload", files={"file": ("offer_letter.png", f, "image/png")}, headers=H).json()
did = doc["id"]
print(f"[2] uploaded offer_letter.png -> doc {did}")

t0 = time.time()
job = http.post(f"{API}/documents/{did}/process", headers=H).json()
print(f"[3] pipeline processed in {time.time()-t0:.1f}s -> status={job.get('status')} step={job.get('current_step')}")

dets = http.get(f"{API}/documents/{did}/detections", headers=H).json()
print(f"[4] AI Layout Boxes: {len(dets)} components")
for det in sorted(dets, key=lambda x: x["bbox"]["y"]):
    b = det["bbox"]
    tier = "HIGH" if det["confidence"] >= 0.85 else ("MEDIUM" if det["confidence"] >= 0.65 else "LOW")
    print(f"      {det['category']:10s} conf={det['confidence']:.2f} [{tier}]  "
          f"x={b['x']:.3f} y={b['y']:.3f} w={b['w']:.3f} h={b['h']:.3f}")

prev = http.get(f"{API}/documents/{did}/preview?page=1", headers=H)
overlay_path = os.path.join(OUT, "live_overlay.png")
draw_boxes(prev.content, dets, overlay_path)
print(f"[5] overlay rendered -> {overlay_path}")

prot = http.post(f"{API}/documents/{did}/protect",
                 json={"level": "high", "method": "redact", "elements": ["signature", "stamp"]}, headers=H)
print(f"[6] protected copy: {prot.status_code} method={prot.json().get('method')} elements={prot.json().get('elements')}")
pc = http.get(f"{API}/documents/{did}/protected-copy?download=1", headers=H)
prot_path = os.path.join(OUT, "live_protected.png")
with open(prot_path, "wb") as f:
    f.write(pc.content)
print(f"[7] redacted copy saved -> {prot_path}")

ver = http.post(f"{API}/documents/{did}/verify", headers=H).json()
print(f"[8] verification: id={ver.get('verification_id')} status={ver.get('integrity_status')} risk={ver.get('tamper_risk')}")

print(f"\nDEMO READY: {OUT}")
print("  live_overlay.png   (detected components drawn on the page)")
print("  live_protected.png (signature + stamp redacted)")
