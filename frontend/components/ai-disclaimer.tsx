import { AlertTriangle } from "lucide-react";

export function AIDisclaimer({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-xs leading-relaxed text-slate-300 backdrop-blur-md ${className ?? ""}`}
      role="note"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <p>
        <strong className="font-semibold text-amber-300">Academic & Security Notice:</strong>{" "}
        RakshaDoc AI provides AI-assisted document analysis, privacy protection, and integrity
        verification. Tamper-risk results are probabilistic heuristic assessments and do not
        constitute official legal proof of forgery or authenticity. Official verification should
        always be performed through the relevant issuing government or administrative institution.
      </p>
    </div>
  );
}
