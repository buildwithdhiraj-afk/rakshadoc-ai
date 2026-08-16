import io
from PIL import Image

def create_dummy_image():
    img = Image.new("RGB", (200, 200), color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf

def test_document_upload_and_pipeline(client, auth_tokens):
    token = auth_tokens["user"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload valid image
    img_buf = create_dummy_image()
    files = {"file": ("test_doc.png", img_buf, "image/png")}
    r_up = client.post("/api/documents/upload", files=files, headers=headers)
    assert r_up.status_code == 201
    doc = r_up.json()
    assert doc["original_name"] == "test_doc.png"
    assert doc["status"] in ["uploaded", "completed"]
    doc_id = doc["id"]

    # Start processing
    r_proc = client.post(f"/api/documents/{doc_id}/process", headers=headers)
    assert r_proc.status_code in [200, 202]

    # Get document analysis
    r_ana = client.get(f"/api/documents/{doc_id}/analysis", headers=headers)
    assert r_ana.status_code == 200

    # Get detections
    r_det = client.get(f"/api/documents/{doc_id}/detections", headers=headers)
    assert r_det.status_code == 200

    # Get OCR
    r_ocr = client.get(f"/api/documents/{doc_id}/ocr", headers=headers)
    assert r_ocr.status_code == 200

    # Verify SHA-256 integrity
    r_ver = client.post(f"/api/documents/{doc_id}/verify", headers=headers)
    assert r_ver.status_code == 200
    vdata = r_ver.json()
    assert vdata["integrity_status"] == "VALID"
    verification_id = vdata["verification_id"]

    # Public verification
    r_pub = client.get(f"/api/verify/{verification_id}")
    assert r_pub.status_code == 200
    assert r_pub.json()["integrity_status"] == "VALID"

    # Protection
    r_prot = client.post(
        f"/api/documents/{doc_id}/protect",
        json={"level": "high", "method": "redact", "elements": ["signature", "stamp"]},
        headers=headers
    )
    assert r_prot.status_code == 200

    # Braille translation
    r_br = client.get(f"/api/documents/{doc_id}/braille?language=English", headers=headers)
    assert r_br.status_code == 200
    assert "braille_unicode" in r_br.json()

    # Delete
    r_del = client.delete(f"/api/documents/{doc_id}", headers=headers)
    assert r_del.status_code == 204

def test_invalid_file_upload(client, auth_tokens):
    token = auth_tokens["user"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload disallowed extension
    files = {"file": ("malicious.exe", io.BytesIO(b"binary"), "application/octet-stream")}
    r = client.post("/api/documents/upload", files=files, headers=headers)
    assert r.status_code == 400
