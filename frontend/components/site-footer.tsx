import Link from "next/link";
import { ShieldCheck, Lock, Activity, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";

const productLinks = [
  { href: "/features", label: "Multi-Engine OCR" },
  { href: "/how-it-works", label: "9-Step Pipeline" },
  { href: "/security", label: "Zero-Pixel Leaks" },
  { href: "/accessibility", label: "Braille Bharati G1" },
  { href: "/about", label: "Research Architecture" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Protocol" },
  { href: "/terms", label: "Terms of Compute" },
  { href: "/disclaimer", label: "Academic AI Disclaimer" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-white/[0.08] bg-[#030712] pt-16 pb-12 text-slate-400">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(245,158,11,0.06),transparent)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top nested badge row */}
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-slate-300">
              Pipeline Operational · OpenCV + Pillow + Tesseract Ready
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-400" /> AES-256 / SHA-256
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Zero Pixel Ingress
            </span>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-4">
            <Logo />
            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              Academic-grade document intelligence platform engineered for multilingual Indic
              documents. Protects sensitive authentication seals, verifies cryptographic hash integrity,
              and converts print typography into tactile Braille.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] text-amber-300">
                v1.0.0 Production Core
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-slate-400">
                Academic Edition
              </span>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:col-span-7">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Intelligence Engine
              </h4>
              <ul className="mt-4 space-y-2.5">
                {productLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-xs text-slate-400 transition-colors hover:text-amber-400"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Governance & Safety
              </h4>
              <ul className="mt-4 space-y-2.5">
                {legalLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-xs text-slate-400 transition-colors hover:text-amber-400"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/[0.08] pt-8">
          <p className="text-[11px] leading-relaxed text-slate-400">
            <strong className="font-medium text-slate-300">Academic & Security Notice:</strong>{" "}
            RakshaDoc AI provides AI-assisted document layout segmentation, signature/stamp privacy
            redaction, and cryptographic document fingerprinting. Tamper-risk assessments are
            probabilistic heuristic indicators and do not constitute legal certification of forgery
            or authenticity. All official verifications should be conducted with designated statutory
            authorities.
          </p>
          <div className="mt-4 flex flex-col justify-between gap-2 sm:flex-row text-[11px] text-slate-400 font-mono">
            <span>© 2026 RakshaDoc AI · All Rights Reserved</span>
            <span>Understand · Protect · Verify · Access</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
