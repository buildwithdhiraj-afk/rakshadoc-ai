import type { DetectionCategory } from "@/types";

export const DETECTION_COLORS: Record<DetectionCategory, { label: string; color: string; bgClass: string; textClass: string }> = {
  title: { label: "Document Title", color: "#3b82f6", bgClass: "bg-blue-500", textClass: "text-blue-600" },
  heading: { label: "Header Section", color: "#60a5fa", bgClass: "bg-blue-400", textClass: "text-blue-500" },
  paragraph: { label: "Personal Information Section", color: "#6b7280", bgClass: "bg-slate-500", textClass: "text-slate-600" },
  table: { label: "Transaction Details", color: "#22c55e", bgClass: "bg-emerald-500", textClass: "text-emerald-600" },
  figure: { label: "Visual Element", color: "#10b981", bgClass: "bg-emerald-400", textClass: "text-emerald-500" },
  list: { label: "Itemized Details", color: "#64748b", bgClass: "bg-slate-400", textClass: "text-slate-500" },
  signature: { label: "Signature → HIGH SENSITIVITY", color: "#ef4444", bgClass: "bg-rose-500", textClass: "text-rose-600" },
  stamp: { label: "Official Stamp → HIGH SENSITIVITY", color: "#f97316", bgClass: "bg-amber-500", textClass: "text-amber-600" },
  seal: { label: "Seal Region", color: "#f97316", bgClass: "bg-amber-500", textClass: "text-amber-600" },
  qr_code: { label: "QR Code → MEDIUM SENSITIVITY", color: "#a855f7", bgClass: "bg-purple-500", textClass: "text-purple-600" },
  logo: { label: "Organization Logo", color: "#8b5cf6", bgClass: "bg-purple-400", textClass: "text-purple-500" },
  person: { label: "Person Entity", color: "#3b82f6", bgClass: "bg-blue-500", textClass: "text-blue-600" },
  date: { label: "Date Entity", color: "#10b981", bgClass: "bg-emerald-500", textClass: "text-emerald-600" },
  address: { label: "Address Entity", color: "#f59e0b", bgClass: "bg-amber-500", textClass: "text-amber-600" },
  identity_number: { label: "Identity Number → HIGH SENSITIVITY", color: "#dc2626", bgClass: "bg-rose-600", textClass: "text-rose-600" },
  financial_info: { label: "Financial Information", color: "#059669", bgClass: "bg-emerald-600", textClass: "text-emerald-600" },
};

export const CATEGORY_ORDER: DetectionCategory[] = [
  "title",
  "heading",
  "paragraph",
  "table",
  "figure",
  "list",
  "signature",
  "stamp",
  "seal",
  "qr_code",
  "logo",
  "person",
  "date",
  "address",
  "identity_number",
  "financial_info",
];


