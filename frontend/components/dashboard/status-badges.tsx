import { Badge } from "@/components/ui/badge";
import type { DocumentStatus, RiskLevel } from "@/types";

export function StatusBadge({ status }: { status: DocumentStatus }) {
  switch (status) {
    case "completed":
      return <Badge variant="success">Completed</Badge>;
    case "processing":
      return <Badge variant="warning">Processing</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">Uploaded</Badge>;
  }
}

export function RiskBadge({ risk }: { risk: RiskLevel | null }) {
  if (!risk) return <Badge variant="outline">—</Badge>;
  if (risk === "LOW") return <Badge variant="success">LOW</Badge>;
  if (risk === "MEDIUM") return <Badge variant="warning">MEDIUM</Badge>;
  return <Badge variant="destructive">HIGH</Badge>;
}
