import hashlib
import os
import random
from PIL import Image, ImageDraw, ImageFont
from app.core.config import settings

SAMPLE_NAMES = ["Demo Certificate", "Demo Bank Form", "Demo Government Letter", "Demo Invoice"]

def generate_synthetic_page(doc_id: str, page_num: int, doc_name: str) -> str:
    seed_val = int(hashlib.md5(f"{doc_id}_{page_num}".encode()).hexdigest()[:8], 16)
    random.seed(seed_val)

    w, h = 800, 1000
    img = Image.new("RGB", (w, h), color="#fcfcfc")
    draw = ImageDraw.Draw(img)

    # Outer border & header band
    draw.rectangle([40, 40, w - 40, h - 40], outline="#cbd5e1", width=2)
    draw.rectangle([50, 50, w - 50, 120], fill="#0d2b52")

    # Title
    sample_title = SAMPLE_NAMES[seed_val % len(SAMPLE_NAMES)]
    draw.text((70, 70), f"RAKSHADOC AI — {sample_title.upper()}", fill="#ffffff")

    # Content paragraphs
    for y in range(160, 400, 24):
        line_w = random.randint(300, 680)
        draw.rectangle([70, y, 70 + line_w, y + 8], fill="#94a3b8")

    # Table section
    draw.rectangle([70, 430, 730, 600], outline="#cbd5e1", fill="#f8fafc")
    draw.line([(70, 470), (730, 470)], fill="#cbd5e1", width=2)
    for col in [220, 370, 520]:
        draw.line([(col, 430), (col, 600)], fill="#cbd5e1", width=1)

    # Signature box
    draw.rectangle([70, 680, 280, 780], outline="#dc2626", width=2)
    draw.text((80, 690), "[SIGNATURE AREA]", fill="#dc2626")
    # Draw simulated signature squiggle
    points = [(90 + i * 15, 740 + random.randint(-15, 15)) for i in range(11)]
    draw.line(points, fill="#1e3a5f", width=2)

    # Stamp box
    draw.ellipse([450, 670, 590, 810], outline="#ee7a1b", width=3)
    draw.text((475, 730), "DEMO SEAL", fill="#ee7a1b")

    # QR code placeholder
    draw.rectangle([630, 680, 730, 780], fill="#0f172a")
    draw.rectangle([650, 700, 710, 760], fill="#ffffff")

    # Demo watermark banner
    draw.rectangle([0, h - 30, w, h], fill="#ee7a1b")
    draw.text((w // 4, h - 22), "DEMO DOCUMENT — NOT AN OFFICIAL DOCUMENT", fill="#ffffff")

    out_folder = os.path.join(settings.STORAGE_DIR, doc_id)
    os.makedirs(out_folder, exist_ok=True)
    file_path = os.path.join(out_folder, f"page_{page_num}.png")
    img.save(file_path, "PNG")
    return file_path

def generate_detections_for_page(doc_id: str, page_num: int) -> list:
    return [
        {"category": "title", "bbox": {"x": 0.08, "y": 0.05, "w": 0.84, "h": 0.07}, "confidence": 0.98, "sensitivity": "NONE", "action": "NONE"},
        {"category": "paragraph", "bbox": {"x": 0.08, "y": 0.16, "w": 0.84, "h": 0.24}, "confidence": 0.95, "sensitivity": "NONE", "action": "NONE"},
        {"category": "table", "bbox": {"x": 0.08, "y": 0.43, "w": 0.84, "h": 0.17}, "confidence": 0.93, "sensitivity": "NONE", "action": "NONE"},
        {"category": "signature", "bbox": {"x": 0.08, "y": 0.68, "w": 0.26, "h": 0.10}, "confidence": 0.96, "sensitivity": "HIGH", "action": "PROTECTED"},
        {"category": "stamp", "bbox": {"x": 0.56, "y": 0.67, "w": 0.18, "h": 0.14}, "confidence": 0.91, "sensitivity": "HIGH", "action": "PROTECTED"},
        {"category": "qr_code", "bbox": {"x": 0.78, "y": 0.68, "w": 0.13, "h": 0.10}, "confidence": 0.99, "sensitivity": "MEDIUM", "action": "PROTECTED"},
    ]
