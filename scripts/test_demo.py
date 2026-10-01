import httpx
import os
import sys

base = os.environ.get('RAKSHADOC_API', 'http://localhost:8000/api')

# 1. Register account
r = httpx.post(f'{base}/auth/register', json={'email': 'demo_mca_user@rakshadoc.ai', 'password': 'SecurePassword123!', 'full_name': 'Dhiraj MCA User'})
if r.status_code == 409:
    r = httpx.post(f'{base}/auth/login', json={'email': 'demo_mca_user@rakshadoc.ai', 'password': 'SecurePassword123!'})
data = r.json()
token = data['token']
headers = {'Authorization': f'Bearer {token}'}
print(f"1. Registered Account: {data['user']['email']} (Role: {data['user']['role']})")

# 2. Upload Document (valid image generated in-memory)
from io import BytesIO
from PIL import Image, ImageDraw
img = Image.new('RGB', (800, 1120), '#ffffff')
dr = ImageDraw.Draw(img)
dr.rectangle([60, 50, 740, 170], fill='#1e3a5f')
dr.text((90, 95), 'DEMO CERTIFICATE OF COMPLETION', fill='#ffffff')
for i, line in enumerate(['This is to certify that the candidate has', 'successfully completed the programme.']):
    dr.text((80, 220 + i * 30), line, fill='#1f2937')
dr.rectangle([80, 420, 720, 700], outline='#374151', width=2)
for ry in (490, 560, 630):
    dr.line([(80, ry), (720, ry)], fill='#374151', width=2)
dr.line([(640, 850), (640, 880), (700, 875), (640, 870)], fill='#1e3a8a', width=3)
dr.ellipse([540, 800, 700, 960], outline='#dc2626', width=5)
buf = BytesIO()
img.save(buf, 'PNG')
files = {'file': ('demo_certificate.png', buf.getvalue(), 'image/png')}
up = httpx.post(f'{base}/documents/upload', files=files, headers=headers).json()
doc_id = up['id']
print(f"2. Document Uploaded: ID={doc_id}, File={up['original_name']}, SHA-256={up['sha256_hash'][:12]}...")

# 3. Process Pipeline
proc = httpx.post(f'{base}/documents/{doc_id}/process', headers=headers).json()
print(f"3. Pipeline Processing: Status={proc.get('status')}, Progress={proc.get('progress')}%, Step={proc.get('current_step')}")

# 4. Fetch Layout Detections & OCR
dets = httpx.get(f'{base}/documents/{doc_id}/detections', headers=headers).json()
categories = [d['category'] for d in dets]
print(f"4. Layout Analysis: {len(dets)} elements detected ({', '.join(categories)})")

ocr = httpx.get(f'{base}/documents/{doc_id}/ocr', headers=headers).json()
if ocr:
    print(f"5. OCR Text Extraction: Language={ocr[0]['language']}, Source={ocr[0]['source']}, Chars={len(ocr[0]['text'])}")
else:
    print("5. OCR Text Extraction: no text extracted (no PDF text layer and no OCR engine installed)")

# 5. Generate Protected Copy (Redaction)
prot = httpx.post(f'{base}/documents/{doc_id}/protect', json={'level': 'high', 'method': 'redact', 'elements': ['signature', 'stamp']}, headers=headers).json()
print(f"6. Protected Copy Created: Method={prot['method']}, Elements={prot['elements']}")

# 6. Verify Integrity
ver = httpx.post(f'{base}/documents/{doc_id}/verify', headers=headers).json()
ver_id = ver['verification_id']
print(f"7. Cryptographic Verification: VerificationID={ver_id}, Status={ver['integrity_status']}, TamperRisk={ver['tamper_risk']}")

# 7. Generate Braille Output
braille = httpx.get(f'{base}/documents/{doc_id}/braille?language=Hindi', headers=headers).json()
print(f"8. Braille Accessibility Generated: {len(braille['braille_unicode'])} Unicode cells")

# 8. Public Verification Portal
pub = httpx.get(f'{base}/verify/{ver_id}').json()
print(f"9. Public Verification Portal: MaskedDocID={pub['document_id_masked']}, Integrity={pub['integrity_status']}")

# 9. Audit Trail
audit = httpx.get(f'{base}/documents/{doc_id}/audit', headers=headers).json()
actions = [a['action'] for a in audit]
print(f"10. Audit Log Recorded: {', '.join(actions)}")

