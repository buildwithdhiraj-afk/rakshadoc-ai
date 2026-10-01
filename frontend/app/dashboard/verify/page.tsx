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
  Lock,
  ExternalLink,
} from "lucide-react";
import { DoubleBezelCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-300">
          Cryptographic Proof Engine
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white font-heading sm:text-3xl">
          Integrity & Anti-Tamper Verification
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Compute mathematical SHA-256 proofs to guarantee zero single-pixel modifications or file
          forgery since ingestion.
        </p>
      </div>

      {error ? <ErrorState error={error} onRetry={() => setError(null)} title="Verification diagnostic failed" /> : null}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full bg-white/5 rounded-2xl" />
          <Skeleton className="h-64 w-full bg-white/5 rounded-2xl" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No documents in vault"
          description="Upload and process a document first to generate cryptographic SHA-256 proofs."
          action="Analyze a Document"
          actionHref="/dashboard/analyze"
        />
      ) : (
        <>
          <DoubleBezelCard innerClassName="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="doc-select" className="font-mono text-xs text-slate-300">
                Target Vault Document
              </Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger id="doc-select" className="rounded-xl border-white/10 bg-white/[0.03] text-xs text-white">
                  <SelectValue placeholder="Select a document" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10 bg-[#070b14] text-white">
                  {documents.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs focus:bg-white/10">
                      {d.original_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              onClick={verify}
              disabled={verifying || !selectedId}
              className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-3 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-98 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>Computing SHA-256 Checksum…</span>
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4" />
                  <span>Run Verification Audit</span>
                </>
              )}
            </button>

            {selectedDoc?.status !== "completed" && (
              <p className="font-mono text-[11px] text-amber-400">
                Notice: Document processing is still incomplete. Proof verification is preliminary.
              </p>
            )}
          </DoubleBezelCard>

          {record && (
            <DoubleBezelCard
              className="shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
              innerClassName="p-6 md:p-8 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-white font-heading">
                    Immutable Verification Record
                  </h3>
                  <Badge variant={valid ? "success" : "destructive"}>
                    {valid ? <CheckCircle2 className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                    {valid ? "100% VERIFIED MATCH" : "POTENTIAL TAMPER DETECTED"}
                  </Badge>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  Audit Timestamp: {formatDate(record.created_at)}
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                        Verification Ledger ID
                      </p>
                      <p className="mt-1 font-mono text-xs font-bold text-amber-300">
                        {record.verification_id}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                        Cryptographic Algorithm
                      </p>
                      <p className="mt-1 font-mono text-xs font-bold text-white">
                        {record.hash_algorithm} (FIPS 180-4)
                      </p>
                    </div>

                    <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-black/40 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                          Binary Document Hash
                        </p>
                        <button
                          onClick={copyHash}
                          className="flex items-center gap-1 font-mono text-[10px] text-amber-400 hover:text-amber-300"
                        >
                          {copied ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copied ? "Copied" : "Copy Hash"}</span>
                        </button>
                      </div>
                      <p className="mt-2 break-all font-mono text-xs text-slate-200">
                        {record.document_hash}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                        Tamper Risk Level
                      </p>
                      <div className="mt-1">
                        <RiskBadge risk={record.tamper_risk} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                        Sensitive Marks
                      </p>
                      <p className="mt-1 font-mono text-xs font-bold text-white">
                        {record.sensitive_elements} Elements Isolated
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Code Card */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/60 p-6 text-center lg:col-span-4">
                  <div className="rounded-2xl border border-white/20 bg-white p-3 shadow-xl">
                    {origin ? (
                      <QRCodeSVG
                        value={`${origin}/verify/${record.verification_id}`}
                        size={140}
                        marginSize={0}
                        fgColor="#030712"
                      />
                    ) : (
                      <Skeleton className="h-36 w-36" />
                    )}
                  </div>
                  <p className="mt-4 font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                    Public Verification QR
                  </p>
                  <a
                    href={`/verify/${record.verification_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
                  >
                    Open Public Portal <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </DoubleBezelCard>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-relaxed text-slate-400 font-mono">
            Cryptographic verification proves byte-level correspondence with the original snapshot.
            It does not replace statutory certification from sovereign administrative bodies.
          </div>

          <AIDisclaimer />
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[60vh] w-full bg-white/5 rounded-3xl" />}>
      <VerifyContent />
    </Suspense>
  );
}
