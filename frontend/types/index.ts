export type Role = "guest" | "user" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
}

export type DocumentStatus = "uploaded" | "processing" | "completed" | "failed";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type IntegrityStatus = "VALID" | "TAMPERED" | "UNVERIFIED";

export interface DocumentAnalysis {
  layout: string;
  ocr: string;
  sensitive_elements: number;
  integrity: string;
  protected_copy: string;
  braille: string;
}

export interface Document {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  page_count: number;
  quality_score: number | null;
  status: DocumentStatus;
  sha256_hash: string | null;
  tamper_risk: RiskLevel | null;
  analysis: DocumentAnalysis | null;
  created_at: string;
  demo?: boolean;
}

export type DetectionCategory =
  | "title"
  | "heading"
  | "paragraph"
  | "table"
  | "figure"
  | "list"
  | "signature"
  | "stamp"
  | "seal"
  | "logo"
  | "qr_code";

export interface BBox {
  /** Normalized 0..1 coordinates relative to the full page */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Detection {
  id: string;
  document_id: string;
  page: number;
  category: DetectionCategory;
  bbox: BBox;
  confidence: number;
  sensitivity: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  action: "PROTECTED" | "NONE";
}

export interface StructuredText {
  paragraphs: string[];
}

export interface OCRResult {
  document_id: string;
  page: number;
  language: string;
  language_confidence: number;
  source: "demo" | "real";
  text: string;
  structured: StructuredText;
}

export interface ProcessingStep {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
}

export interface ProcessingJob {
  id: string;
  document_id: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  current_step: string | null;
  steps: string[];
  completed_steps: string[];
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
}

export interface VerificationRecord {
  id: string;
  verification_id: string;
  document_id: string;
  hash_algorithm: string;
  document_hash: string;
  integrity_status: IntegrityStatus;
  tamper_risk: RiskLevel;
  sensitive_elements: number;
  protected_copy_available: boolean;
  braille_available: boolean;
  created_at: string;
}

export interface PublicVerification {
  verification_id: string;
  document_id_masked: string;
  integrity_status: IntegrityStatus;
  tamper_risk: RiskLevel;
  protected_copy_available: boolean;
  braille_available: boolean;
  created_at: string;
  version: string;
  notice: string;
}

export type ProtectionMethod = "redact" | "blur" | "pixelate" | "mask";

export interface ProtectedCopy {
  id: string;
  document_id: string;
  protection_level: "standard" | "high";
  method: ProtectionMethod;
  elements: string[];
  created_at: string;
}

export interface BrailleOutput {
  document_id: string;
  language: string;
  braille_unicode: string;
  braille_bytes: number;
  extracted_text: string;
  source: "demo" | "real";
}

export interface AuditEvent {
  id: string;
  user_id: string | null;
  document_id: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface AdminMetrics {
  documents_processed: number;
  average_processing_time_s: number;
  layout_map: number | null;
  ocr_accuracy: number | null;
  sensitive_map: number | null;
  tamper_f1: number | null;
  model_size_mb: number | null;
  average_memory_mb: number | null;
  model_available: boolean;
  demo_mode: boolean;
  [key: string]: string | number | boolean | null;
}

export interface Experiment {
  id: string;
  name: string;
  short_name: string;
  description: string;
  status: "evaluated" | "not_evaluated";
  metrics: Record<string, number | string | null>;
  evaluated_at: string | null;
}

export interface ModelInfo {
  name: string;
  version: string;
  available: boolean;
  backend: string;
  loaded: boolean;
  input: string;
  notes: string;
}

export interface HealthResponse {
  status: string;
  demo_mode: boolean;
  version: string;
  model_available: boolean;
  uptime_s: number;
}

export interface ApiError {
  detail: string;
  code?: string;
  status?: number;
}
