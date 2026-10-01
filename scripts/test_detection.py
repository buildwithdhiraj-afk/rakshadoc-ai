"""Sanity-check detection on the synthetic demo page (offline, no server)."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.demo_generator import generate_synthetic_page
from ml.document_detection import detect_document_components, sanitize_bbox

p = generate_synthetic_page("dettest_1", 1, "Test.png")
dets = detect_document_components(p)
print("count:", len(dets))
for d in dets:
    b = d["bbox"]
    valid = sanitize_bbox(b) is not None
    print(f"{d['category']:10s} bbox=({b['x']:.3f},{b['y']:.3f},{b['w']:.3f},{b['h']:.3f}) "
          f"conf={d['confidence']} sens={d['sensitivity']} valid={valid}")
cats = sorted(d["category"] for d in dets)
print("categories:", cats)
expected = ["paragraph", "qr_code", "signature", "stamp", "table", "title"]
missing = [e for e in expected if e not in cats]
print("MISSING:", missing if missing else "none")

# expected ground-truth regions on the 800x1000 synthetic layout
truth = {
    "title": (0.0625, 0.05, 0.875, 0.07),
    "paragraph": (0.0875, 0.16, 0.8375, 0.24),
    "table": (0.0875, 0.43, 0.825, 0.17),
    "signature": (0.0875, 0.68, 0.2625, 0.10),
    "stamp": (0.5625, 0.67, 0.175, 0.14),
    "qr_code": (0.7875, 0.68, 0.125, 0.10),
}
print("\ncenter-distance from ground truth (should be < 0.05):")
for d in dets:
    if d["category"] in truth:
        t = truth[d["category"]]
        b = d["bbox"]
        dcx = abs((b["x"] + b["w"] / 2) - (t[0] + t[2] / 2))
        dcy = abs((b["y"] + b["h"] / 2) - (t[1] + t[3] / 2))
        print(f"  {d['category']:10s} dx={dcx:.3f} dy={dcy:.3f} ok={dcx < 0.05 and dcy < 0.05}")

# bbox validation rules from the brief
print("\nvalidation rules:")
for d in dets:
    b = d["bbox"]
    assert 0 <= b["x"], d
    assert 0 <= b["y"], d
    assert b["w"] > 0 and b["h"] > 0, d
    assert b["x"] + b["w"] <= 1.0 + 1e-9, d
    assert b["y"] + b["h"] <= 1.0 + 1e-9, d
print("  all boxes pass x>=0, y>=0, w>0, h>0, x+w<=1, y+h<=1")

# cleanup temp storage
import shutil
from app.core.config import settings
shutil.rmtree(os.path.join(settings.STORAGE_DIR, "dettest_1"), ignore_errors=True)
