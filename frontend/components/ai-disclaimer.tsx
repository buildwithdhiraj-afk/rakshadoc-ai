import { AlertTriangle } from "lucide-react";

export function AIDisclaimer({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground ${className ?? ""}`}
      role="note"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <p>
        RakshaDoc AI provides AI-assisted document analysis, privacy protection and integrity
        verification. Tamper-risk results are probabilistic and are not legal proof of forgery or
        authenticity. Official or legal verification should be performed through the relevant
        authoritative institution.
      </p>
    </div>
  );
}
