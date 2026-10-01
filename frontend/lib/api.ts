import type {
  ApiError,
  AuditEvent,
  BrailleOutput,
  Detection,
  Document,
  DocumentInsights,
  HealthResponse,
  OCRResult,
  ProcessingJob,
  ProtectedCopy,
  ProtectionMethod,
  PublicVerification,
  User,
  VerificationRecord,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const TOKEN_KEY = "rakshadoc_token";
const USER_KEY = "rakshadoc_user";

export class ApiClientError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(USER_KEY);
}

export function clearAuth() {
  setToken(null);
  setStoredUser(null);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isFormData = false,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!isFormData && options.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    body = await res.json();
  }

  if (!res.ok) {
    const err = (body ?? {}) as Partial<ApiError>;
    if (res.status === 401) clearAuth();
    throw new ApiClientError(
      err.detail ?? `Request failed (${res.status})`,
      res.status,
      err.code,
    );
  }

  return body as T;
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; full_name: string }) =>
    request<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request<User>("/auth/me"),

  // Documents
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<Document>("/documents/upload", { method: "POST", body: fd }, true);
  },
  demoSample: (sampleType = "certificate") =>
    request<Document>(`/documents/demo-sample?sample_type=${encodeURIComponent(sampleType)}`, { method: "POST" }),
  listDocuments: () => request<Document[]>("/documents"),
  getDocument: (id: string) => request<Document>(`/documents/${id}`),
  process: (id: string) =>
    request<ProcessingJob>(`/documents/${id}/process`, { method: "POST" }),
  getProcessing: (id: string) => request<ProcessingJob>(`/documents/${id}/processing`),
  getAnalysis: (id: string) => request<Document>(`/documents/${id}/analysis`),
  getOcr: (id: string) => request<OCRResult[]>(`/documents/${id}/ocr`),
  getDetections: (id: string) => request<Detection[]>(`/documents/${id}/detections`),
  getInsights: (id: string) => request<DocumentInsights>(`/documents/${id}/insights`),
  previewUrl: (id: string, page = 1) => `${API_URL}/documents/${id}/preview?page=${page}`,
  protect: (
    id: string,
    data: {
      level: "standard" | "high";
      method: ProtectionMethod;
      elements: string[];
    },
  ) => request<ProtectedCopy>(`/documents/${id}/protect`, { method: "POST", body: JSON.stringify(data) }),
  getProtectedCopy: (id: string) =>
    request<ProtectedCopy & { download_url: string }>(`/documents/${id}/protected-copy`),
  verify: (id: string) => request<VerificationRecord>(`/documents/${id}/verify`, { method: "POST" }),
  getBraille: (id: string, language?: string) =>
    request<BrailleOutput>(`/documents/${id}/braille${language ? `?language=${encodeURIComponent(language)}` : ""}`),
  getAudit: (id: string) => request<AuditEvent[]>(`/documents/${id}/audit`),
  deleteDocument: (id: string) => request<void>(`/documents/${id}`, { method: "DELETE" }),

  // Public
  verifyPublic: (verificationId: string) =>
    request<PublicVerification>(`/verify/${verificationId}`),

  // Admin
  adminMetrics: () => request<Record<string, unknown>>("/admin/metrics"),
  adminAuditLogs: () => request<AuditEvent[]>("/admin/audit-logs"),

  // Health
  health: () => request<HealthResponse>("/health"),
};

/**
 * `<img src>` and `<a href>` cannot send an `Authorization` header, so every
 * asset URL built here carries the JWT as a `token` query parameter. The
 * backend's `get_current_user_payload` accepts it as an alternative to the
 * bearer header (see app/core/security.py). Without this, page images and
 * protected copies return 401 and the viewer renders a broken image.
 */
function withToken(url: string): string {
  const token = getToken();
  if (!token) return url;
  return `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
}

export function signedUrl(id: string, page = 1): string {
  return withToken(`${API_URL}/documents/${id}/preview?page=${page}`);
}

/** Whole protected document (multi-page PDF when the source has several pages). */
export function protectedCopyUrl(id: string): string {
  return withToken(`${API_URL}/documents/${id}/protected-copy?download=1`);
}

/** One protected page, as a PNG for the viewer's Protected Copy tab. */
export function protectedPreviewUrl(id: string, page = 1): string {
  return withToken(`${API_URL}/documents/${id}/protected-copy?page=${page}`);
}
