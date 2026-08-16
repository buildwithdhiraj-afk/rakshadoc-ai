"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Copy,
  Fingerprint,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { AIDisclaimer } from "@/components/ai-disclaimer";
import { RiskBadge } from "@/components/dashboard/status-badges";
import { api } from "@/lib/api";
import { formatDate, truncateHash } from "@/lib/utils";
import type { Document, VerificationRecord } from "@/types";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [verifying, setVerifying] = useState(false);
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    let ignore = false;
    api
      .listDocuments()
      .then((docs) => {
        if (ignore) return;
        setDocuments(docs);
        const fromParam = searchParams.get("doc");
        if (fromParam && docs.some((d) => d.id === fromParam)) {
          setSelectedId(fromParam);
        } else if (docs.length > 0) {
          setSelectedId(docs[0].id);
        }
      })
      .catch((err) => {
        if (!ignore) setError(err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [searchParams]);

  async function verify() {
    if (!selectedId) return;
    setError(null);
    setVerifying(true);
    setRecord(null);
    try {
      setRecord(await api.verify(selectedId));
    } catch (err) {
      setError(err);
    } finally {
      setVerifying(false);
    }
  }

  async function copyHash() {
    if (!record) return;
    try {
      await navigator.clipboard.writeText(record.document_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const selectedDoc = documents.find((d) => d.id === selectedId);
  const valid = record?.integrity_status === "VALID";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Verify Integrity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm the exact file has not changed since its SHA-256 hash was recorded.
        </p>
      </div>

      {error ? <ErrorState error={error} onRetry={() => setError(null)} title="Verification failed" /> : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No documents to verify"
          description="Upload and process a document first, then come back to verify its integrity."
          action="Analyze a Document"
          actionHref="/dashboard/analyze"
        />
      ) : (
        <>
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Label htmlFor="doc-select">Document</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger id="doc-select">
                    <SelectValue placeholder="Select a document" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.original_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="saffron" className="w-full sm:w-auto" onClick={verify} disabled={verifying || !selectedId}>
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                {verifying ? "Verifying…" : "Verify Integrity"}
              </Button>
              {selectedDoc?.status !== "completed" && (
                <p className="text-xs text-warning">
                  This document has not completed processing. Verification may not be available.
                </p>
              )}
            </CardContent>
          </Card>

          {record && (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">Verification Record</CardTitle>
                  <Badge variant={valid ? "success" : "destructive"}>
                    {valid ? <CheckCircle2 className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                    {valid ? "VERIFIED" : "TAMPERED"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Recorded {formatDate(record.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-[1fr_auto]">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Document ID
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                        {record.verification_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Hash Algorithm
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {record.hash_algorithm}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Document Hash
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="break-all rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                          {truncateHash(record.document_hash)}
                        </code>
                        <Button variant="ghost" size="icon-sm" onClick={copyHash} aria-label="Copy full hash">
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Tamper Risk
                      </p>
                      <div className="mt-1">
                        <RiskBadge risk={record.tamper_risk} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Sensitive Elements
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {record.sensitive_elements}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Protected Copy
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {record.protected_copy_available ? "✓ Available" : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Braille Output
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {record.braille_available ? "✓ Available" : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-xl border bg-white p-3">
                    {origin ? (
                      <QRCodeSVG
                        value={`${origin}/verify/${record.verification_id}`}
                        size={128}
                        marginSize={0}
                        fgColor="#0d2b52"
                      />
                    ) : (
                      <Skeleton className="h-32 w-32" />
                    )}
                  </div>
                  <p className="max-w-[160px] text-center text-[11px] text-muted-foreground">
                    Public verification link
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedDoc?.demo && (
            <p className="flex items-start gap-2 rounded-lg border border-dashed border-warning/40 bg-warning/5 p-3 text-sm text-muted-foreground">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              The integrity hash and verification for this document are real, but its analysis was
              produced in demo mode.
            </p>
          )}

          <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
            Integrity verification confirms that the exact file has not changed after the recorded
            hash was generated. It does not independently prove legal authenticity.
          </div>

          <Separator />

          <AIDisclaimer />
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[60vh] w-full" />}>
      <VerifyContent />
    </Suspense>
  );
}
