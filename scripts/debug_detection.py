"""Debug why stamp mask catches the QR square and why body bars aren't lines."""
import sys, os, cv2, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.demo_generator import generate_synthetic_page

p = generate_synthetic_page("detdbg_1", 1, "Test.png")
img = cv2.imread(p)
h, w = img.shape[:2]
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

m_warm = cv2.inRange(hsv, (0, 55, 55), (32, 255, 255))
m_cool = cv2.inRange(hsv, (95, 40, 40), (175, 255, 255))
mask = cv2.bitwise_or(m_warm, m_cool)
print("stamp mask pixels:", cv2.countNonZero(mask))

# QR square region: how many mask pixels and from which hue?
qr = mask[680:781, 630:731]
print("QR region mask px:", cv2.countNonZero(qr), "of", qr.size)
ys, xs = np.nonzero(qr)
for i in range(0, min(len(ys), 8)):
    y, x = 680 + ys[i], 630 + xs[i]
    print(f"  in-mask px at ({x},{y}) bgr={img[y,x]} hsv={hsv[y,x]}")
# sample the ring directly (top edge y=682, x=640..720)
row = mask[682, 630:731]
print("QR top-row mask:", row)
print("img top row bgr:", img[682, 630:731:15])
for c in cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
    bx, by, bw, bh = cv2.boundingRect(c)
    area = cv2.contourArea(c)
    if bw > 50 and bh > 30:
        # sample a pixel from this contour's bbox center
        cy, cx = by + bh // 2, bx + bw // 2
        b, g, r = img[cy, cx]
        print(f"  blob ({bx},{by},{bw},{bh}) area={area:.0f} center_px_bgr=({b},{g},{r}) hsv={hsv[cy,cx]}")

# --- text lines ---
th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
close_k = max(5, w // 90)
line_mask = cv2.morphologyEx(th, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (close_k, 3)))
print("\nline contours:")
for c in cv2.findContours(line_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
    bx, by, bw, bh = cv2.boundingRect(c)
    if bh >= 4 and bh <= 70 and bw >= 0.05 * w:
        region = gray[by:by + bh, bx:bx + bw]
        mean = float(region.mean()) if region.size else -1
        print(f"  ({bx},{by},{bw},{bh}) mean_gray={mean:.0f}")

import shutil
from app.core.config import settings
shutil.rmtree(os.path.join(settings.STORAGE_DIR, "detdbg_1"), ignore_errors=True)
