"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Accessibility,
  Copy,
  Download,
  Loader2,
  Sparkles,
  Glasses,
  CheckCircle2,
  FileText,
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
import { api } from "@/lib/api";
import type { BrailleOutput, Document } from "@/types";

const LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Gujarati",
  "Bengali",
  "Punjabi",
  "Malayalam",
  "Odia",
  "Urdu",
];

function downloadText(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function BrailleContent() {
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [language, setLanguage] = useState("Hindi");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<BrailleOutput | null>(null);
  const [copied, setCopied] = useState(false);

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

  async function generate() {
    if (!selectedId) return;
    setError(null);
    setGenerating(true);
    setOutput(null);
    try {
      setOutput(await api.getBraille(selectedId, language));
    } catch (err) {
      setError(err);
    } finally {
      setGenerating(false);
    }
  }

  async function copyBraille() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output.braille_unicode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-purple-300">
          Accessibility Synthesis
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white font-heading sm:text-3xl flex items-center gap-2.5">
          <Glasses className="h-7 w-7 text-purple-400" /> Bharati Braille Accessibility Matrix
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Transform extracted multilingual Indian text into standard 6-dot Unicode Braille matrices
          and exportable .brf streams for refreshable Braille hardware and embossers.
        </p>
      </div>

      {error ? <ErrorState error={error} onRetry={() => setError(null)} title="Braille synthesis diagnostic alert" /> : null}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full bg-white/5 rounded-2xl" />
          <Skeleton className="h-64 w-full bg-white/5 rounded-2xl" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={Accessibility}
          title="No documents in vault"
          description="Upload and process a document first to synthesize Braille output."
          action="Analyze a Document"
          actionHref="/dashboard/analyze"
        />
      ) : (
        <>
          <DoubleBezelCard innerClassName="p-6 md:p-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="braille-doc" className="font-mono text-xs text-slate-300">
                  Target Document
                </Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger id="braille-doc" className="rounded-xl border-white/10 bg-white/[0.03] text-xs text-white">
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

              <div className="space-y-1.5">
                <Label htmlFor="braille-lang" className="font-mono text-xs text-slate-300">
                  Target Indic Language Script
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="braille-lang" className="rounded-xl border-white/10 bg-white/[0.03] text-xs text-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-white/10 bg-[#070b14] text-white">
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l} className="text-xs focus:bg-white/10">
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={generating || !selectedId}
              className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 px-6 py-3 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-98 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>Synthesizing Bharati Braille Cells…</span>
                </>
              ) : (
                <>
                  <Accessibility className="h-4 w-4" />
                  <span>Generate Braille Output</span>
                </>
              )}
            </button>
          </DoubleBezelCard>

          {output && (
            <div className="space-y-6">
              <DoubleBezelCard
                className="shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
                innerClassName="p-6 md:p-8 space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Unicode Braille Tactile Matrix
                    </h3>
                    <p className="font-mono text-[11px] text-purple-300">
                      Language: {output.language} · Length: {output.braille_bytes} bytes
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {output.source === "pdf_text_layer"
                      ? "PDF Text Layer"
                      : output.source === "tesseract"
                        ? "Tesseract OCR Extraction"
                        : "Structured Extract"}
                  </Badge>
                </div>

                <div className="overflow-auto rounded-2xl border border-purple-500/30 bg-[#0d071a] p-6 shadow-inner">
                  <p className="whitespace-pre-wrap break-words font-mono text-3xl md:text-4xl leading-relaxed tracking-widest text-purple-300">
                    {output.braille_unicode}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    onClick={copyBraille}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white"
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied" : "Copy Braille Text"}</span>
                  </button>
                  <button
                    onClick={() => downloadText(output.braille_unicode, "braille-output.brf")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-300 hover:bg-purple-500/20"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Braille (.brf)</span>
                  </button>
                  <button
                    onClick={() => downloadText(output.extracted_text, "extracted-text.txt")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/10"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download TXT</span>
                  </button>
                </div>
              </DoubleBezelCard>

              <DoubleBezelCard innerClassName="p-6 md:p-8 space-y-4">
                <div className="border-b border-white/[0.08] pb-3">
                  <h4 className="text-sm font-bold text-white font-heading">
                    Source Extracted Reading Stream
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Ordered paragraphs parsed from document layout segmentation.
                  </p>
                </div>

                {output.extracted_text ? (
                  <div className="max-h-72 space-y-3 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 font-sans text-xs leading-relaxed text-slate-200">
                    {output.extracted_text
                      .split(/\n{2,}/)
                      .map((p, i) =>
                        p.trim() ? (
                          <p key={i} className="text-slate-300">
                            {p.trim()}
                          </p>
                        ) : null,
                      )}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-slate-500">No extracted text tokens available.</p>
                )}
              </DoubleBezelCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function BraillePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[60vh] w-full bg-white/5 rounded-3xl" />}>
      <BrailleContent />
    </Suspense>
  );
}
