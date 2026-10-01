import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Award, BookOpen, Cpu, Eye, FileText, Fingerprint, Glasses, Hash, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DoubleBezelCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIDisclaimer } from "@/components/ai-disclaimer";

export const metadata: Metadata = {
  title: "About the Research & Architecture",
  description:
    "About RakshaDoc AI — Master of Computer Applications (MCA) major project engineering secure, verifiable, and accessible multilingual document intelligence.",
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      <SiteHeader />

      <main className="relative z-10 pt-36 pb-28 md:pt-44 md:pb-36">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              Research & Vision
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white font-heading sm:text-6xl">
              RakshaDoc AI Architecture
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-400 sm:text-base leading-relaxed">
              Academic document-intelligence platform designed to solve the structural complexities
              of scanned Indian government and civil documents.
            </p>
          </div>

          {/* Mission Card */}
          <DoubleBezelCard innerClassName="p-8 md:p-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Cpu className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-white font-heading">
                Vision & Purpose
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Indian official documents present unique challenges: mixed Devanagari and Latin typography,
              faded municipal ink stamps, manual signatures intersecting body text, degraded paper
              contrast, and lack of standardized accessible formats. RakshaDoc AI solves these through an
              end-to-end 9-step pipeline uniting OpenCV morphological vision, Tesseract Indic OCR,
              Pillow destructive redaction, FIPS SHA-256 integrity ledgering, and Bharati Braille Grade 1
              synthesis.
            </p>
          </DoubleBezelCard>

          {/* Four Core Pillars */}
          <div>
            <h3 className="text-lg font-bold text-white font-heading mb-6">
              The Four Core Pillars
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Understand (Layout & OCR)",
                  icon: Eye,
                  desc: "Isolate columns, tables, headers, and multilingual tokens with sub-millimeter precision across Indic scripts.",
                  tone: "text-amber-400",
                },
                {
                  title: "Protect (Zero-Pixel Privacy)",
                  icon: Fingerprint,
                  desc: "Detect sensitive authentication marks (seals, signatures, QR codes) and perform permanent pixel overwrites.",
                  tone: "text-red-400",
                },
                {
                  title: "Verify (Cryptographic Proof)",
                  icon: Hash,
                  desc: "Compute immutable SHA-256 hashes to guarantee file integrity and prevent undetected forgery or manipulation.",
                  tone: "text-emerald-400",
                },
                {
                  title: "Access (Braille Inclusion)",
                  icon: Glasses,
                  desc: "Synthesize 6-dot Unicode Braille matrices and structured reading flows for visually impaired readers.",
                  tone: "text-purple-400",
                },
              ].map((pillar, idx) => (
                <DoubleBezelCard key={idx} innerClassName="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <pillar.icon className={`h-5 w-5 ${pillar.tone}`} />
                    </div>
                    <h4 className="text-sm font-bold text-white font-heading">{pillar.title}</h4>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">{pillar.desc}</p>
                </DoubleBezelCard>
              ))}
            </div>
          </div>

          {/* Academic MCA Project Context */}
          <DoubleBezelCard innerClassName="p-8 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-heading">
                Master of Computer Applications (MCA) Major Project
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Developed by Dhiraj as a comprehensive MCA major project focused on Applied Machine
              Intelligence, Document Layout Parsing, Privacy-Preserving Computer Vision, and Accessibility
              Engineering.
            </p>
          </DoubleBezelCard>

          <AIDisclaimer />

          <div className="text-center pt-6">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-1.5 pl-6 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(245,158,11,0.6)] active:scale-98"
            >
              <span>Explore The Live Sandbox</span>
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
