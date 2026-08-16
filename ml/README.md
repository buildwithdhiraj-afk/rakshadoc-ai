# ML Layer Architecture — RakshaDoc AI

This directory contains modular interfaces for machine learning inference modules in RakshaDoc AI.

## Supported Modules

1. **Document Layout Analysis (`layout/`)**: Detects bounding boxes and semantic categories (title, paragraph, table, figure, signature, stamp, etc.).
2. **OCR (`ocr/`)**: Modular engine interface supporting Tesseract, PaddleOCR, EasyOCR, or custom Indic models.
3. **Sensitive Element Detection (`sensitive/`)**: Computer vision model for signature, seal, stamp and logo detection.
4. **Tamper Risk Analysis (`tamper/`)**: Risk assessment based on artifacts, compression, font inconsistency, and spatial anomalies.
5. **Braille Translation (`braille/`)**: Extracted text to Bharati & Latin Braille Grade 1 conversion.

## Demo Mode vs Real Inference

By default, RakshaDoc AI operates in **Demo Mode** (`DEMO_MODE=true` in `.env`).
To plug in trained PyTorch weights:
1. Implement the corresponding `Protocol` defined in `ml/interfaces.py`.
2. Load model weights into `models/`.
3. Set `DEMO_MODE=false` in environment variables.
