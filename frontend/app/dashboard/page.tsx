"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Cpu,
  FileText,
  HardDrive,
  Loader2,
  Plus,
  ShieldCheck,
  ShieldLock,
  Sparkles,
} from "lucide-react";
import { DoubleBezelCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { StatusBadge } from "@/components/dashboard/status-badges";
import { api } from "@/lib/api";
import { cn, formatBytes, svgToPngBlob } from "@/lib/utils";
import type { Document } from "@/types";

interface DemoDocPreset {
  id: string;
  name: string;
  type: string;
  desc: string;
  svgContent: string;
  width: number;
  height: number;
}

const DEMO_PRESETS: DemoDocPreset[] = [
  {
    id: "birth-certificate",
    name: "Maharashtra_Birth_Certificate.png",
    type: "Civil Record",
    desc: "Bilingual Devanagari/English record with municipal seal, registrar stamp, and signature.",
    width: 800,
    height: 1100,
    svgContent: `<svg width="800" height="1100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#fffcf0" />
      <rect x="20" y="20" width="760" height="1060" fill="none" stroke="#b45309" stroke-width="4" stroke-dasharray="10,5" />
      <text x="400" y="80" font-family="sans-serif" font-size="28" font-weight="bold" fill="#78350f" text-anchor="middle">GOVERNMENT OF MAHARASHTRA</text>
      <text x="400" y="120" font-family="sans-serif" font-size="22" font-weight="bold" fill="#78350f" text-anchor="middle">महाराष्ट्र शासन · जन्म नोंदणी प्रमाणपत्र</text>
      <text x="400" y="160" font-family="sans-serif" font-size="16" fill="#92400e" text-anchor="middle">DEPARTMENT OF HEALTH &amp; FAMILY WELFARE</text>
      <line x1="60" y1="190" x2="740" y2="190" stroke="#b45309" stroke-width="2" />
      <text x="80" y="250" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1f2937">Registration No / नोंदणी क्रमांक:</text>
      <text x="400" y="250" font-family="sans-serif" font-size="18" fill="#111827">MH-PUN-2024-884920</text>
      <text x="80" y="300" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1f2937">Child Name / बाळ नाव:</text>
      <text x="400" y="300" font-family="sans-serif" font-size="18" fill="#111827">अद्वैत राजेश सावंत (Advait Rajesh Sawant)</text>
      <text x="80" y="350" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1f2937">Date of Birth / जन्म दिनांक:</text>
      <text x="400" y="350" font-family="sans-serif" font-size="18" fill="#111827">14/08/2024</text>
      <text x="80" y="400" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1f2937">Place of Birth / जन्म ठिकाण:</text>
      <text x="400" y="400" font-family="sans-serif" font-size="18" fill="#111827">Pune Municipal General Hospital, Pune</text>
      <text x="80" y="450" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1f2937">Father Name / वडिलांचे नाव:</text>
      <text x="400" y="450" font-family="sans-serif" font-size="18" fill="#111827">राजेश मारुती सावंत (Rajesh Maruti Sawant)</text>
      <text x="80" y="500" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1f2937">Mother Name / आईचे नाव:</text>
      <text x="400" y="500" font-family="sans-serif" font-size="18" fill="#111827">सुप्रिया राजेश सावंत (Supriya Rajesh Sawant)</text>
      <circle cx="200" cy="750" r="70" fill="none" stroke="#1e40af" stroke-width="4" stroke-dasharray="8,4" />
      <text x="200" y="740" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1e40af" text-anchor="middle">OFFICIAL SEAL</text>
      <text x="200" y="765" font-family="sans-serif" font-size="11" fill="#1e40af" text-anchor="middle">REGISTRAR PUNE</text>
      <path d="M 500 780 Q 550 720, 600 760 T 700 740" fill="none" stroke="#0f172a" stroke-width="3" />
      <text x="600" y="810" font-family="sans-serif" font-size="14" font-weight="bold" fill="#374151" text-anchor="middle">Authorized Signatory</text>
      <text x="600" y="830" font-family="sans-serif" font-size="12" fill="#6b7280" text-anchor="middle">Registrar of Births &amp; Deaths</text>
      <rect x="300" y="940" width="200" height="40" fill="#fef3c7" stroke="#d97706" stroke-width="1" rx="4" />
      <text x="400" y="965" font-family="sans-serif" font-size="13" font-weight="bold" fill="#92400e" text-anchor="middle">DEMO DOCUMENT</text>
    </svg>`,
  },
];

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const docs = await api.listDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const docs = await api.listDocuments();
        if (!ignore) setDocuments(docs);
      } catch (err) {
        if (!ignore) setError(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const handleLoadPreset = async (preset: DemoDocPreset) => {
    setLoadingPreset(preset.id);
    try {
      const png = await svgToPngBlob(
        preset.svgContent,
        preset.width,
        preset.height,
      );
      const file = new File([png], preset.name, { type: "image/png" });
      const doc = await api.upload(file);
      // Uploading only stores bytes; OCR, layout and Braille all run in the
      // pipeline, so the preset would otherwise land as an unprocessed doc.
      await api.process(doc.id);
      router.push(`/dashboard/documents/${doc.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingPreset(null);
    }
  };

  const totalDocs = documents.length;
  const completed = documents.filter((d) => d.status === "completed").length;
  const highRisk = documents.filter(
    (d) => d.tamper_risk === "HIGH",
  ).length;
  const storageBytes = documents.reduce((sum, d) => sum + (d.size_bytes || 0), 0);
  const recent = documents.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-300">
              Workspace Operational
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              SHA-256 Engine Active
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white font-heading sm:text-3xl">
            Intelligence Overview
          </h1>
          <p className="text-xs text-slate-400">
            Monitor encrypted repository telemetry, pipeline executions, and tamper indicators.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/analyze"
            className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-1 pl-4 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-98"
          >
            <span>Analyze New Document</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/20 text-slate-950 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={load} title="Failed to load documents" />
      ) : null}

      {/* Metric Stats Cards (Doppelrand nested containers) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Documents",
            value: loading ? "..." : totalDocs,
            sub: totalDocs === 0 ? "Upload to get started" : "Indexed in Vault",
            icon: Cpu,
            tone: "text-amber-400",
          },
          {
            label: "High-Risk Flags",
            value: loading ? "..." : highRisk,
            sub: highRisk > 0 ? "Review Required" : "Zero active alerts",
            icon: ShieldLock,
            tone: "text-red-400",
          },
          {
            label: "Completed Analyses",
            value: loading ? "..." : completed,
            sub: completed > 0 ? "100% Pipeline pass" : "No runs yet",
            icon: ShieldCheck,
            tone: "text-emerald-400",
          },
          {
            label: "Vault Footprint",
            value: loading ? "..." : formatBytes(storageBytes),
            sub: "Encrypted memory storage",
            icon: HardDrive,
            tone: "text-cyan-400",
          },
        ].map((stat, idx) => (
          <DoubleBezelCard key={idx} innerClassName="p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
              <stat.icon className={cn("h-4 w-4", stat.tone)} />
            </div>
            <p className="mt-3 font-mono text-2xl font-bold text-white font-heading">
              {stat.value}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">{stat.sub}</p>
          </DoubleBezelCard>
        ))}
      </div>

      {/* 1-Click Instant Demo Benchmark Launcher */}
      <DoubleBezelCard
        className="ring-amber-500/20 bg-gradient-to-r from-amber-500/10 via-white/[0.02] to-transparent"
        innerClassName="p-6 md:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Instant Benchmark Sample (1-Click Run)
              </h3>
              <p className="text-xs text-slate-400">
                Test the complete 9-stage pipeline with pre-configured authentic Indian document structures.
              </p>
            </div>
          </div>
          <Badge variant="demo" className="text-[9px]">
            Synthetic Seed Ready
          </Badge>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-5 transition-all duration-300 hover:border-amber-500/30"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-white">
                    {preset.name}
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] text-amber-300">
                    {preset.type}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{preset.desc}</p>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => handleLoadPreset(preset)}
                  disabled={Boolean(loadingPreset)}
                  className="group relative inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md transition-all hover:bg-amber-400 active:scale-95 disabled:opacity-50"
                >
                  {loadingPreset === preset.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Ingesting bytes...</span>
                    </>
                  ) : (
                    <>
                      <span>Execute Full Pipeline</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </DoubleBezelCard>

      {/* Recent Activity Vault */}
      <DoubleBezelCard innerClassName="p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white font-heading">
              Recent Vault Ingests
            </h3>
          </div>
          <Link
            href="/dashboard/documents"
            className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            View all documents <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full bg-white/5 rounded-2xl" />
              <Skeleton className="h-14 w-full bg-white/5 rounded-2xl" />
            </div>
          ) : recent.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-400 font-mono">
              No documents currently in vault. Use &quot;Analyze New Document&quot; or the
              Instant Sample above.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recent.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                  className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left backdrop-blur-md transition-all duration-300 hover:border-amber-500/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 group-hover:text-amber-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <p className="truncate text-xs font-semibold text-white">
                        {doc.original_name}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">
                        {formatBytes(doc.size_bytes)} · UUID: {doc.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={doc.status} />
                    <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DoubleBezelCard>
    </div>
  );
}
