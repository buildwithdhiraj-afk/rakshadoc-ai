import type { DetectionCategory } from "@/types";

export const DETECTION_COLORS: Record<DetectionCategory, { label: string; color: string }> = {
  title: { label: "Title", color: "#2563eb" },
  heading: { label: "Heading", color: "#3b82f6" },
  paragraph: { label: "Paragraph", color: "#7c3aed" },
  table: { label: "Table", color: "#0d9488" },
  figure: { label: "Figure", color: "#16a34a" },
  list: { label: "List", color: "#d97706" },
  signature: { label: "Signature", color: "#dc2626" },
  stamp: { label: "Official Stamp", color: "#ee7a1b" },
  seal: { label: "Seal", color: "#ee7a1b" },
  qr_code: { label: "QR Code", color: "#4f46e5" },
  logo: { label: "Logo", color: "#64748b" },
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
];
