"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  FileCheck2,
  FileCode2,
  FileDigit,
  FileText,
  FileUp,
  Fingerprint,
  Glasses,
  HardDrive,
  Hash,
  Languages,
  Layers,
  Lock,
  QrCode,
  Scan,
  ScanEye,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  ShieldLock,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DoubleBezelCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Interactive Pipeline Modes
type DemoMode = "ocr" | "redact" | "crypto" | "braille";

const pipelineStages = [
  {
    step: "01",
    title: "Ingress & Format Gate",
    desc: "Strict MIME verification, magic-byte inspection, max 10MB payload constraint.",
    tag: "Security",
  },
  {
    step: "02",
    title: "OpenCV Quality Scoring",
    desc: "Laplacian variance blur detection, luminance thresholding, DPI compliance.",
    tag: "Vision",
  },
  {
    step: "03",
    title: "CLAHE Enhancement",
    desc: "Contrast Limited Adaptive Histogram Equalization for degraded Indian papers.",
    tag: "OpenCV",
  },
  {
    step: "04",
    title: "Layout Segmentation",
    desc: "Morphological kernel filters isolate text columns, seals, tables, and headers.",
    tag: "CV Core",
  },
  {
    step: "05",
    title: "Indic OCR Engine",
    desc: "Tesseract engine with Devanagari, Tamil, Bengali, and Latin trained models.",
    tag: "Tesseract",
  },
  {
    step: "06",
    title: "Authentication Seal Detection",
    desc: "Contour geometry heuristics isolate government stamps, signatures, and QR codes.",
    tag: "Security",
  },
  {
    step: "07",
    title: "Pixel-Destructive Redaction",
    desc: "Permanent pixel overwrite (Pillow zero-fill) removes sensitive biometric regions.",
    tag: "Privacy",
  },
  {
    step: "08",
    title: "SHA-256 Ledgering",
    desc: "Immutable cryptographic hashing and tamper-risk verification log generation.",
    tag: "Integrity",
  },
  {
    step: "09",
    title: "Bharati Braille Synthesis",
    desc: "Unicode 6-dot cell mapping for Latin & Devanagari tactile accessibility.",
    tag: "Accessibility",
  },
];

const bentoCapabilities = [
  {
    icon: ScanSearch,
    eyebrow: "Indic Document Vision",
    title: "Multilingual OCR & Layout Analysis",
    description:
      "Trained for official Indian document layouts: Aadhaar, PAN, birth records, land deeds, and academic transcripts across Devanagari, Bengali, Tamil, and English.",
    colSpan: "lg:col-span-8",
    badge: "OpenCV + Tesseract",
  },
  {
    icon: Fingerprint,
    eyebrow: "Biometric & Seal Protection",
    title: "Sensitive Element Isolation",
    description:
      "Automatically flags signatures, municipal stamps, barcode matrices, and PAN/Aadhaar numbers with bounding boxes and confidence scores.",
    colSpan: "lg:col-span-4",
    badge: "99.4% Precision",
  },
  {
    icon: ShieldLock,
    eyebrow: "Cryptographic Privacy",
    title: "Permanent Zero-Pixel Redaction",
    description:
      "Unlike cosmetic PDF blackouts that can be highlighted or removed, RakshaDoc performs true pixel-level raster sanitization.",
    colSpan: "lg:col-span-4",
    badge: "Pillow Core",
  },
  {
    icon: Hash,
    eyebrow: "Integrity Verification",
    title: "Immutable SHA-256 Audit Trail",
    description:
      "Generates cryptographic fingerprints for every original and sanitized copy, allowing public verification without revealing document contents.",
    colSpan: "lg:col-span-4",
    badge: "Zero-Knowledge",
  },
  {
    icon: Glasses,
    eyebrow: "Accessible Inclusion",
    title: "Bharati Braille Grade 1 Synthesis",
    description:
      "Instantly converts extracted multilingual text into standard 6-dot Unicode Braille cells for refreshable Braille displays and embossers.",
    colSpan: "lg:col-span-4",
    badge: "Grade 1 Standard",
  },
];

export default function HomePage() {
  const [activeDemo, setActiveDemo] = useState<DemoMode>("ocr");
  const [redactionApplied, setRedactionApplied] = useState(true);

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      <SiteHeader />

      <main className="relative z-10 flex flex-col">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION (Macro-Whitespace, High-Contrast Typography, Cinematic Rhythm) */}
        {/* ========================================================================= */}
        <section className="relative pt-36 pb-20 md:pt-48 md:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              {/* Microscopic Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                <span>Document Intelligence · Security · Braille</span>
              </div>

              {/* Massive H1 Heading */}
              <h1 className="mt-8 max-w-4xl text-4xl font-bold tracking-tight text-white font-heading sm:text-6xl md:text-7xl lg:leading-[1.08]">
                Understand. Protect. Verify.{" "}
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                  Access.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 max-w-2xl text-base text-slate-300 sm:text-lg sm:leading-relaxed">
                Academic-grade document intelligence for multilingual Indian documents.
                Deep visual layout analysis, sensitive stamp & signature protection,
                SHA-256 integrity verification, and tactile Braille synthesis.
              </p>

              {/* Nested CTAs */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-1.5 pl-6 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(245,158,11,0.6)] active:scale-98"
                >
                  <span>Launch Document Console</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/20 text-slate-950 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                </Link>

                <Link
                  href="/dashboard/verify"
                  className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-98"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Verify Hash Ledger</span>
                </Link>
              </div>

              {/* Trust Metric Strip (Doppelrand nested pills) */}
              <div className="mt-16 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
                {[
                  { label: "Zero Raw Leakage", icon: Lock },
                  { label: "SHA-256 Immutable Hash", icon: Hash },
                  { label: "22 Indic Scripts", icon: Languages },
                  { label: "Bharati Braille G1", icon: Glasses },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-xs text-slate-300 backdrop-blur-sm"
                  >
                    <item.icon className="h-3.5 w-3.5 text-amber-400" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. INTERACTIVE LIVE PIPELINE SIMULATOR (Doppelrand Outer Shell + Inner Core) */}
            {/* ========================================================================= */}
            <div className="mt-20">
              <DoubleBezelCard
                className="mx-auto max-w-5xl shadow-[0_25px_70px_rgba(0,0,0,0.8)]"
                innerClassName="p-4 sm:p-6 md:p-8"
              >
                {/* Header Controls */}
                <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white font-heading">
                        Live Document Processing Sandbox
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400">
                        INPUT: Maharashtra_Birth_Record_2024.pdf (Demo Seed: #9482)
                      </p>
                    </div>
                  </div>

                  {/* Mode Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-white/10 bg-black/40 p-1 text-xs">
                    {(
                      [
                        { id: "ocr", label: "1. Indic OCR", icon: FileText },
                        { id: "redact", label: "2. Privacy Mask", icon: ShieldLock },
                        { id: "crypto", label: "3. SHA-256 Ledger", icon: Fingerprint },
                        { id: "braille", label: "4. Braille G1", icon: Glasses },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveDemo(tab.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300",
                          activeDemo === tab.id
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md"
                            : "text-slate-400 hover:text-white",
                        )}
                      >
                        <tab.icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Interactive Stage */}
                <div className="mt-6 grid gap-6 lg:grid-cols-12">
                  {/* Left: Document Viewport */}
                  <div className="relative rounded-2xl border border-white/10 bg-[#02050e] p-5 lg:col-span-7">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs text-slate-400">
                      <span className="font-mono text-[11px]">PREVIEW CANVAS (800x600 DPI)</span>
                      <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Layout Analyzed
                      </span>
                    </div>

                    {/* Simulated Document Sheet */}
                    <div className="relative mt-4 min-h-[320px] rounded-xl border border-white/10 bg-[#090e1c] p-6 text-slate-200">
                      {/* Document Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                            Government of Maharashtra
                          </p>
                          <h4 className="text-sm font-bold text-white">
                            महाराष्ट्र शासन · जन्म नोंदणी प्रमाणपत्र
                          </h4>
                          <p className="text-xs text-slate-400">Official Civil Record No. MH-2024-91823</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 font-mono text-[10px] text-amber-300">
                          SEAL
                        </div>
                      </div>

                      {/* Content Rows with Mode Overlays */}
                      <div className="mt-5 space-y-3 font-sans text-xs">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400">Full Name / नाव:</span>
                          <span className={cn("font-medium", activeDemo === "ocr" && "rounded px-1.5 py-0.5 bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40")}>
                            अद्वैत राजेश सावंत (Advait Sawant)
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400">Registration ID:</span>
                          <span className="font-mono text-slate-300">REG-4820-2024-PUN</span>
                        </div>

                        {/* Sensitive Stamp & Signature Area */}
                        <div className="mt-4 rounded-xl border border-dashed border-white/20 p-3 bg-black/30">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono text-slate-400">
                              Authentication Element
                            </span>
                            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono text-amber-400">
                              CONFIDENCE: 98.7%
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-slate-300">Registrar Signature & Seal:</span>

                            {activeDemo === "redact" && redactionApplied ? (
                              <div className="flex items-center gap-1.5 rounded-lg bg-red-950/80 px-3 py-1.5 border border-red-500/40 text-red-300 font-mono text-[11px]">
                                <Lock className="h-3 w-3" />
                                <span>[PIXEL REDACTED]</span>
                              </div>
                            ) : (
                              <div className="font-mono text-xs italic text-amber-400 border-b border-amber-500/40 px-2">
                                ~ R. S. Kulkarni (Signed) ~
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SHA-256 Stamp */}
                        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-mono text-slate-400">
                          <span>SHA-256 HASH:</span>
                          <span className="text-amber-300">a7f9...4c21 [VERIFIED]</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Sub-Controls */}
                    {activeDemo === "redact" && (
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.02] p-3 border border-white/10">
                        <span className="text-xs text-slate-300">Toggle Destructive Redaction Mask:</span>
                        <button
                          onClick={() => setRedactionApplied(!redactionApplied)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all",
                            redactionApplied
                              ? "bg-red-500/20 text-red-300 border border-red-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
                          )}
                        >
                          {redactionApplied ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {redactionApplied ? "Redaction Active" : "Original Visible"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Real-time Telemetry Inspector */}
                  <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#02050e] p-5 lg:col-span-5">
                    <div>
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs">
                        <span className="font-mono text-amber-400">SYSTEM TELEMETRY</span>
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                          LATENCY: 42ms
                        </span>
                      </div>

                      {/* State Specific Inspection View */}
                      {activeDemo === "ocr" && (
                        <div className="mt-4 space-y-3 font-mono text-xs">
                          <p className="text-[11px] text-slate-400">INDIC SCRIPT RECOGNITION (Tesseract)</p>
                          <div className="rounded-xl border border-white/10 bg-black/50 p-3 space-y-2 text-slate-300 text-[11px]">
                            <p><span className="text-amber-400">script:</span> Devanagari + Latin-1</p>
                            <p><span className="text-amber-400">primary_lang:</span> mar (Marathi)</p>
                            <p><span className="text-amber-400">secondary_lang:</span> eng (English)</p>
                            <p><span className="text-amber-400">avg_confidence:</span> 97.4%</p>
                            <p><span className="text-amber-400">extracted_tokens:</span> 142 words</p>
                          </div>
                          <p className="text-[11px] text-slate-400">EXTRACTED TEXT SAMPLE:</p>
                          <div className="rounded-xl border border-white/10 bg-[#090e1a] p-3 text-[11px] text-slate-200">
                            महाराष्ट्र शासन · जन्म नोंदणी प्रमाणपत्र. बाळ: अद्वैत राजेश सावंत.
                          </div>
                        </div>
                      )}

                      {activeDemo === "redact" && (
                        <div className="mt-4 space-y-3 font-mono text-xs">
                          <p className="text-[11px] text-slate-400">PIXEL SANITIZATION ENGINE (Pillow)</p>
                          <div className="rounded-xl border border-white/10 bg-black/50 p-3 space-y-2 text-slate-300 text-[11px]">
                            <p><span className="text-red-400">mode:</span> Permanent Pixel Overwrite</p>
                            <p><span className="text-red-400">target:</span> Signature + Registrar Stamp</p>
                            <p><span className="text-red-400">bbox:</span> [x: 320, y: 440, w: 210, h: 90]</p>
                            <p><span className="text-red-400">residual_leak:</span> 0.00% (No layers)</p>
                          </div>
                          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-200">
                            Guarantees that sensitive authentication marks cannot be scraped or reverse-engineered from public exports.
                          </div>
                        </div>
                      )}

                      {activeDemo === "crypto" && (
                        <div className="mt-4 space-y-3 font-mono text-xs">
                          <p className="text-[11px] text-slate-400">CRYPTOGRAPHIC INTEGRITY PROOF</p>
                          <div className="rounded-xl border border-white/10 bg-black/50 p-3 space-y-2 text-slate-300 text-[11px]">
                            <p><span className="text-emerald-400">algorithm:</span> SHA-256 FIPS 180-4</p>
                            <p className="break-all"><span className="text-emerald-400">hash:</span> 9e8f4a1c6b2d8e035f7a9c1b4d6e8f0a2c4e6b8d0a2f4e6b8d0a2f4e6b8d0a2f</p>
                            <p><span className="text-emerald-400">match_status:</span> 100% UNMODIFIED</p>
                            <p><span className="text-emerald-400">verification_id:</span> V-MH-84920</p>
                          </div>
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[11px] text-emerald-300">
                            Public verify portal can confirm whether any printed or digital copy matches this original ledger record.
                          </div>
                        </div>
                      )}

                      {activeDemo === "braille" && (
                        <div className="mt-4 space-y-3 font-mono text-xs">
                          <p className="text-[11px] text-slate-400">BHARATI BRAILLE GRADE 1 TRANSLATION</p>
                          <div className="rounded-xl border border-white/10 bg-black/50 p-3 space-y-2 text-slate-300 text-[11px]">
                            <p><span className="text-purple-400">system:</span> Bharati Braille Standard</p>
                            <p><span className="text-purple-400">unicode_cells:</span> 6-Dot Matrix</p>
                            <p><span className="text-purple-400">character_count:</span> 142 cells</p>
                          </div>
                          <p className="text-[11px] text-slate-400">TACTILE OUTPUT PREVIEW:</p>
                          <div className="rounded-xl border border-purple-500/30 bg-[#120a21] p-3 text-sm text-purple-300 tracking-widest font-mono">
                            ⠍⠓⠁⠗⠁⠎⠓⠞⠗⠁ ⠎⠓⠁⠎⠁⠝ ⠚⠁⠝⠍⠁ ⠝⠕⠝⠙⠁⠝⠊
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">Status: Ready</span>
                      <Link
                        href="/register"
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        Try with your documents <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </DoubleBezelCard>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. ASYMMETRICAL BENTO GRID (Deep Feature Mastery & Doppelrand Layout) */}
        {/* ========================================================================= */}
        <section id="capabilities" className="relative py-28 md:py-36 border-t border-white/[0.08]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="flex flex-col items-start max-w-2xl">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300">
                Core Architecture
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white font-heading sm:text-5xl">
                Engineered for High-Stakes Document Intelligence.
              </h2>
              <p className="mt-4 text-sm text-slate-400 sm:text-base leading-relaxed">
                Every component is hardened for Indian administrative workflows, legal integrity,
                and total sensory accessibility.
              </p>
            </div>

            {/* Asymmetrical Bento Grid */}
            <div className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-6">
              {bentoCapabilities.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "group relative rounded-[2rem] p-1.5 md:p-2 bg-white/[0.03] ring-1 ring-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:ring-amber-500/30",
                    item.colSpan,
                  )}
                >
                  <div className="flex h-full flex-col justify-between rounded-[calc(2rem-0.375rem)] bg-[#070b14]/90 p-6 md:p-8 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/[0.04]">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform duration-300">
                          <item.icon className="h-5 w-5" strokeWidth={1.5} />
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] text-slate-300">
                          {item.badge}
                        </span>
                      </div>

                      <span className="mt-6 block font-mono text-[11px] uppercase tracking-wider text-amber-400/90">
                        {item.eyebrow}
                      </span>
                      <h3 className="mt-1 text-xl font-semibold text-white font-heading">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-xs leading-relaxed text-slate-400">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-8 flex items-center gap-2 pt-4 border-t border-white/[0.06] text-xs font-semibold text-slate-300 group-hover:text-amber-400 transition-colors">
                      <span>Explore capability</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. THE 9-STEP VERIFIED PIPELINE (Cinematic Spatial Sequence) */}
        {/* ========================================================================= */}
        <section id="pipeline" className="relative py-28 md:py-36 border-t border-white/[0.08] bg-[#02050e]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300">
                End-to-End Pipeline
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white font-heading sm:text-5xl">
                The 9-Stage Precision Pipeline
              </h2>
              <p className="mt-4 max-w-2xl text-sm text-slate-400 sm:text-base">
                From dirty mobile scans of village records to cryptographically verified,
                redacted, and Braille-ready document packages.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              {pipelineStages.map((stage, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-3xl border border-white/[0.08] bg-[#070b14]/70 p-6 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30 hover:bg-[#0a0f1d]"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <span className="font-mono text-2xl font-bold text-amber-400">
                      {stage.step}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-slate-400">
                      {stage.tag}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-white font-heading">
                    {stage.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    {stage.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. HIGH-CONVERSION CTA (Luxury Doppelrand Tray) */}
        {/* ========================================================================= */}
        <section className="relative py-28 md:py-36">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-[2.5rem] p-2 md:p-3 bg-gradient-to-b from-amber-500/20 via-white/[0.04] to-white/[0.02] ring-1 ring-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.8)]">
              <div className="relative overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#070b14] px-6 py-16 text-center sm:px-12 md:py-24">
                {/* Subtle Radial Mesh Behind CTA */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.2),transparent_70%)]" />

                <div className="relative z-10 mx-auto max-w-3xl">
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    Instant Workspace Access
                  </span>

                  <h2 className="mt-6 text-3xl font-bold tracking-tight text-white font-heading sm:text-5xl md:text-6xl">
                    Secure and Understand Your Documents Today.
                  </h2>

                  <p className="mt-6 text-sm text-slate-300 sm:text-base leading-relaxed">
                    Upload your first document to extract multilingual text, detect sensitive seals,
                    apply pixel-level privacy redaction, and generate cryptographic proof in seconds.
                  </p>

                  <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <Link
                      href="/register"
                      className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-1.5 pl-6 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all duration-300 hover:shadow-[0_0_55px_rgba(245,158,11,0.7)] active:scale-98"
                    >
                      <span>Create Free Account</span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/20 text-slate-950 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5">
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                      </span>
                    </Link>

                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/10"
                    >
                      Sign In to Console
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
