"""Fetch the Tesseract traineddata this project needs into backend/tessdata.

The Devanagari language packs cannot be installed into
`C:\\Program Files\\Tesseract-OCR\\tessdata` without admin rights, so the backend
keeps its own copy and points TESSDATA_PREFIX at it (see ml/ocr.py). This script
creates that directory and downloads the packs.

    python scripts/fetch_tessdata.py

The traineddata files are ~7 MB of binaries and are intentionally NOT committed;
run this once after cloning.
"""

import os
import urllib.request

LANGUAGES = ("eng", "hin", "mar")
BASE = "https://github.com/tesseract-ocr/tessdata_fast/raw/main"
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(REPO, "backend", "tessdata")


def main() -> int:
    os.makedirs(DEST, exist_ok=True)
    failed = []
    for lang in LANGUAGES:
        target = os.path.join(DEST, f"{lang}.traineddata")
        if os.path.isfile(target):
            print(f"  {lang}: already present")
            continue
        url = f"{BASE}/{lang}.traineddata"
        try:
            print(f"  {lang}: downloading...")
            urllib.request.urlretrieve(url, target)
            size = os.path.getsize(target) / 1_048_576
            print(f"  {lang}: {size:.2f} MB")
        except Exception as exc:
            print(f"  {lang}: FAILED ({exc})")
            failed.append(lang)

    print(f"\nDestination: {DEST}")
    if failed:
        print(f"Failed: {', '.join(failed)}. English OCR still works.")
        return 1
    print("Hindi and Marathi OCR are now available without admin rights.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
