import type { Metadata } from "next";
import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  FileCheck2,
  FileScan,
  FileText,
  Fingerprint,
  HardDrive,
  Hash,
  Languages,
  Layers,
  Lock,
  ScanSearch,
  ShieldCheck,
  ShieldLock,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DoubleBezelCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "9-Step Intelligence Pipeline",
  description:
    "Discover how RakshaDoc AI processes, secures, verifies, and transforms multilingual Indian documents in 9 precise steps.",
};

const pipelineSteps = [
  {
    num: "01",
    title: "MIME Ingest & Magic Byte Validation",
    icon: UploadCloud,
    tag: "Security Filter",
    desc: "Every payload is verified by binary header inspection (PNG, JPEG, PDF) before entering memory. Files are assigned private UUID storage locations.",
  },
  {
    num: "02",
    title: "OpenCV Quality & Blur Diagnostic",
    icon: ScanSearch,
    tag: "Computer Vision",
    desc: "Computes Laplacian variance, contrast distribution, and brightness scores. Documents falling below quality thresholds trigger enhancement warnings.",
  },
  {
    num: "03",
    title: "CLAHE & Adaptive Preprocessing",
    icon: Sparkles,
    tag: "Enhancement",
    desc: "Applies Contrast Limited Adaptive Histogram Equalization to restore low-contrast stamps, weathered ink, and mobile camera shadows.",
  },
  {
    num: "04",
    title: "Morphological Layout Segmentation",
    icon: Layers,
    tag: "Structure",
    desc: "Identifies document bounding boxes, distinguishing header crests, official tables, seals, signature regions, and body paragraphs.",
  },
  {
    num: "05",
    title: "Indic Multilingual OCR Extraction",
    icon: Languages,
    tag: "Tesseract Engine",
    desc: "Runs multi-script OCR on extracted layout blocks, capturing Devanagari, Marathi, Hindi, Tamil, and English with per-token confidence metrics.",
  },
  {
    num: "06",
    title: "Sensitive Authentication Seal Detection",
    icon: Fingerprint,
    tag: "Heuristic Engine",
    desc: "Identifies sensitive authentication artifacts: registrar signatures, official departmental stamps, barcode matrices, and identity numbers.",
  },
  {
    num: "07",
    title: "Pillow Destructive Privacy Redaction",
    icon: ShieldLock,
    tag: "Privacy Layer",
    desc: "Executes raster-level pixel destruction (blackout or Gaussian blur) over selected sensitive zones, preventing data extraction from exports.",
  },
  {
    num: "08",
    title: "SHA-256 Hash Ledgering & Proofs",
    icon: Hash,
    tag: "Integrity",
    desc: "Generates cryptographic SHA-256 hashes of original and redacted documents, logging tamper-proof metadata into the audit ledger.",
  },
  {
    num: "09",
    title: "Bharati Braille Grade 1 Generation",
    icon: Accessibility,
    tag: "Accessibility",
    desc: "Converts extracted text into standard 6-dot Unicode Braille characters and formatted TXT files for refreshable Braille hardware.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      <SiteHeader />

      <main className="relative z-10 pt-36 pb-28 md:pt-44 md:pb-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              Architecture & Execution
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white font-heading sm:text-6xl">
              The 9-Step Verification Pipeline
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-400 sm:text-base leading-relaxed">
              Step-by-step mathematical flow: from uploaded document bytes to cryptographically
              fingerprinted, privacy-redacted, and accessible Braille outputs.
            </p>
          </div>

          {/* Timeline Process Cards */}
          <div className="mt-20 relative">
            {/* Center glowing line on desktop */}
            <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-amber-500/40 via-white/10 to-transparent pointer-events-none" />

            <div className="space-y-12">
              {pipelineSteps.map((step, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col lg:flex-row items-center gap-8",
                      isEven ? "lg:flex-row-reverse" : "",
                    )}
                  >
                    {/* Content Card */}
                    <div className="w-full lg:w-1/2">
                      <DoubleBezelCard
                        className={cn("group transition-all duration-300 hover:ring-amber-500/30")}
                        innerClassName="p-6 md:p-8"
                      >
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-2xl font-bold text-amber-400">
                              {step.num}
                            </span>
                            <span className="font-mono text-xs text-slate-400">
                              STAGE {idx + 1}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {step.tag}
                          </Badge>
                        </div>

                        <div className="mt-5 flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                            <step.icon className="h-5 w-5" strokeWidth={1.5} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white font-heading">
                              {step.title}
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-slate-400">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      </DoubleBezelCard>
                    </div>

                    {/* Center Node Indicator */}
                    <div className="hidden lg:flex shrink-0 items-center justify-center h-10 w-10 rounded-full border border-amber-500/40 bg-[#070b14] text-amber-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] z-20">
                      {step.num}
                    </div>

                    {/* Empty Space for symmetrical timeline */}
                    <div className="hidden lg:block w-1/2" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-24 text-center">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-1.5 pl-6 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(245,158,11,0.6)] active:scale-98"
            >
              <span>Test The Pipeline Live</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/20 text-slate-950 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
              </span>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
