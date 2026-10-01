"use client";

import { useRef, useState } from "react";
import { FileText, Sparkles, Loader2, UploadCloud, ShieldCheck, ArrowUpRight, Cpu } from "lucide-react";
import { DoubleBezelCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/error-state";
import { ProcessingView } from "@/components/dashboard/processing-view";
import { api } from "@/lib/api";
import { cn, formatBytes } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/tiff",
  "image/webp",
  "image/bmp",
];
const MAX_SIZE_MB = 25;

const SAMPLE_OPTIONS = [
  { type: "certificate", label: "Demo Certificate", desc: "Signature, Stamp & QR Code" },
  { type: "bank_form", label: "Demo Bank Form", desc: "Form fields & Tables" },
  { type: "government_letter", label: "Demo Govt Notice", desc: "Multilingual Indic text" },
  { type: "invoice", label: "Demo Invoice", desc: "Itemized layout structure" },
];

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(f: File): string | null {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return "Unsupported file format. Please upload a PDF, PNG, JPG, JPEG, TIFF, BMP, or WEBP file.";
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return "File too large. Maximum allowed size is 25 MB.";
    }
    return null;
  }

  async function handleFile(f: File) {
    setError(null);
    const problem = validate(f);
    if (problem) {
      setError(new Error(problem));
      return;
    }
    setFile(f);

    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewDataUrl(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreviewDataUrl(null);
    }

    setUploading(true);
    try {
      const doc = await api.upload(f);
      await api.process(doc.id);
      setDocumentId(doc.id);
      setDocumentName(doc.original_name);
    } catch (err) {
      setError(err);
      setUploading(false);
    }
  }

  async function handleSample(sampleType: string) {
    setError(null);
    setUploading(true);
    try {
      const doc = await api.demoSample(sampleType);
      await api.process(doc.id);
      setDocumentId(doc.id);
      setDocumentName(doc.original_name);
    } catch (err) {
      setError(err);
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-300">
          Compute Ingest Stage
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white font-heading sm:text-3xl">
          Document Intelligence Ingest
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Upload official certificates, deeds, or administrative notices to run layout parsing,
          Indic OCR, sensitive seal isolation, cryptographic hashing, and Braille synthesis.
        </p>
      </div>

      {/* 1-Click Instant Demo Benchmark Launcher */}
      <DoubleBezelCard
        className="ring-amber-500/20 bg-gradient-to-r from-amber-500/10 via-white/[0.02] to-transparent"
        innerClassName="p-6"
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">
                Instant Demo Benchmarks
              </h3>
              <p className="text-[11px] text-slate-400">
                Execute without uploading your own file.
              </p>
            </div>
          </div>
          <Badge variant="demo" className="text-[9px]">
            1-Click Run
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SAMPLE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              disabled={uploading}
              onClick={() => handleSample(opt.type)}
              className="group flex flex-col items-start rounded-2xl border border-white/10 bg-black/40 p-3.5 text-left transition-all duration-300 hover:border-amber-500/40 hover:bg-[#0a0f1d] disabled:opacity-50"
            >
              <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                {opt.label}
              </span>
              <span className="mt-1 text-[10px] text-slate-400 leading-tight">
                {opt.desc}
              </span>
            </button>
          ))}
        </div>
      </DoubleBezelCard>

      {error ? (
        <ErrorState error={error} title="Upload Diagnostic Alert" onRetry={() => setError(null)} />
      ) : null}

      {documentId ? (
        <ProcessingView documentId={documentId} fileName={documentName} />
      ) : (
        <DoubleBezelCard innerClassName="p-6 md:p-8 space-y-6">
          <div className="border-b border-white/[0.08] pb-4">
            <h2 className="text-lg font-bold text-white font-heading">
              Secure Document Ingress
            </h2>
            <p className="text-xs text-slate-400">
              Original document binary is safely isolated in non-public storage. All redaction and
              verification operations occur on memory-bounded copies.
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />

          <div
            role="button"
            tabIndex={0}
            aria-label="Upload a document"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300",
              dragging
                ? "border-amber-400 bg-amber-500/10 scale-[0.99]"
                : "border-white/15 bg-black/40 hover:border-amber-500/50 hover:bg-black/60",
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
                <p className="font-mono text-xs text-amber-300">
                  Ingesting bytes & initializing OpenCV / Tesseract workers...
                </p>
              </div>
            ) : previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Document thumbnail preview"
                className="h-32 max-w-full rounded-xl object-contain border border-white/20 shadow-lg"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-amber-400 group-hover:scale-105 transition-transform">
                <UploadCloud className="h-8 w-8" strokeWidth={1.5} />
              </div>
            )}

            {!uploading && (
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-white font-heading">
                  Drag & Drop Document Payload Here
                </p>
                <p className="text-xs text-slate-400">
                  or <span className="font-semibold text-amber-400 underline underline-offset-4">browse local files</span>
                </p>
                <p className="pt-2 font-mono text-[10px] text-slate-400">
                  PDF, PNG, JPG, JPEG, TIFF, BMP, WEBP · Max 25 MB · Up to 100 pages
                </p>
              </div>
            )}
          </div>

          {file && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{file.name}</p>
                <p className="font-mono text-[10px] text-slate-400">{formatBytes(file.size)}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {file.type.split("/")[1]?.toUpperCase() || "PAYLOAD"}
              </Badge>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 text-xs text-slate-300">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p className="text-[11px] leading-relaxed">
              <strong className="text-emerald-300">Zero Raw Ingress Leakage:</strong> Ingestion
              immediately computes SHA-256 binary hash sum. Original pixels are isolated from public routes.
            </p>
          </div>
        </DoubleBezelCard>
      )}
    </div>
  );
}
