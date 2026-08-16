import httpx

import sys

base = 'http://localhost:8000/api'

# 1. Register account
r = httpx.post(f'{base}/auth/register', json={'email': 'demo_mca_user@rakshadoc.ai', 'password': 'SecurePassword123!', 'full_name': 'Dhiraj MCA User'})
if r.status_code == 409:
    r = httpx.post(f'{base}/auth/login', json={'email': 'demo_mca_user@rakshadoc.ai', 'password': 'SecurePassword123!'})
data = r.json()
token = data['token']
headers = {'Authorization': f'Bearer {token}'}
print(f"1. Registered Account: {data['user']['email']} (Role: {data['user']['role']})")

# 2. Upload Document
files = {'file': ('demo_certificate.png', b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82', 'image/png')}
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
print(f"5. OCR Text Extraction: Language={ocr[0]['language']}")

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

