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
    target_categories = target_categories or ["signature", "stamp", "seal", "qr_code", "person"]
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
            else:
                raise ValueError(f"Unsupported protection method: {method}")

    img.save(output_path, "PNG")
    return output_path


def page_detections(detections: list, page_no: int) -> list:
    """Filter detections down to a single page.

    Bounding boxes are page-relative, so applying every page's detections to one
    rendered page draws regions that do not exist on it. A detection without a
    page is treated as belonging to the page being rendered.
    """
    page_no = int(page_no)
    out = []
    for det in detections:
        page = det.page if hasattr(det, "page") else det.get("page")
        if page is None or int(page) == page_no:
            out.append(det)
    return out


def build_protected_pdf(image_paths: list, output_path: str) -> str:
    """Combine per-page protected images into a single multi-page PDF.

    Raises ValueError when no page images are supplied.
    """
    if not image_paths:
        raise ValueError("build_protected_pdf requires at least one page image")

    images = []
    for path in image_paths:
        with Image.open(path) as img:
            images.append(img.convert("RGB"))

    if len(images) == 1:
        images[0].save(output_path, "PDF", resolution=150.0)
    else:
        images[0].save(
            output_path, "PDF", resolution=150.0, save_all=True, append_images=images[1:]
        )
    return output_path
