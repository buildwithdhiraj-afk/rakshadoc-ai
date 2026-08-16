import io
import os
import uuid
from PIL import Image, ImageDraw, ImageFilter
from app.core.config import settings

def apply_protection(
    image_path: str,
    detections: list,
    output_path: str,
    method: str = "redact",
    target_categories: list = None
):
    target_categories = target_categories or ["signature", "stamp", "seal", "qr_code"]
    img = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    w_img, h_img = img.size

    for det in detections:
        cat = det.category if hasattr(det, "category") else det.get("category")
        if cat in target_categories:
            bbox = det.bbox if hasattr(det, "bbox") else det.get("bbox")
            x1 = int(bbox["x"] * w_img)
            y1 = int(bbox["y"] * h_img)
            x2 = int((bbox["x"] + bbox["w"]) * w_img)
            y2 = int((bbox["y"] + bbox["h"]) * h_img)

            if method == "redact":
                draw.rectangle([x1, y1, x2, y2], fill="#1e293b")
                draw.text((x1 + 4, y1 + 4), f"[{cat.upper()} PROTECTED]", fill="#ffffff")
            elif method == "blur":
                box_crop = img.crop((x1, y1, x2, y2)).filter(ImageFilter.GaussianBlur(15))
                img.paste(box_crop, (x1, y1))
            elif method == "pixelate":
                box_crop = img.crop((x1, y1, x2, y2))
                small = box_crop.resize((max(1, (x2-x1)//10), max(1, (y2-y1)//10)), resample=Image.NEAREST)
                pixelated = small.resize((x2-x1, y2-y1), resample=Image.NEAREST)
                img.paste(pixelated, (x1, y1))
            elif method == "mask":
                draw.rectangle([x1, y1, x2, y2], fill="#f1f5f9", outline="#0f172a")
                draw.text((x1 + 4, y1 + 4), f"🔒 {cat.upper()} MASKED", fill="#0f172a")

    img.save(output_path, "PNG")
    return output_path
