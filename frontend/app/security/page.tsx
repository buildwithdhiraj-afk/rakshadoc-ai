import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Database,
  EyeOff,
  FileCheck,
  FileKey2,
  Fingerprint,
  HardDrive,
  Hash,
  KeyRound,
  Lock,
  Server,
  ShieldAlert,
  ShieldCheck,
  ShieldLock,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DoubleBezelCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Zero-Leak Security Architecture",
  description:
    "Learn about RakshaDoc AI's zero-knowledge security, permanent pixel redaction, SHA-256 document hashing, and memory-safe processing.",
};

const securityTenets = [
  {
    icon: Database,
    title: "Original File Immutable Preservation",
    desc: "Original document uploads are stored in isolated, non-public UUID disk paths (data/uploads/<uuid>/). They are NEVER overwritten or exposed via public static routes.",
  },
  {
    icon: EyeOff,
    title: "True Pixel-Level Destructive Redaction",
    desc: "Redactions are rendered via direct memory pixel overwrites using Pillow. No vector layers or hidden OCR metadata are preserved in exported public copies.",
  },
  {
    icon: KeyRound,
    title: "Ephemeral Owner-Only JWT Access",
    desc: "Previews and download links require authenticated Bearer JWT tokens or ephemeral signed query tokens with strict role-based access control (RBAC).",
  },
  {
    icon: Hash,
    title: "FIPS 180-4 SHA-256 Cryptographic Fingerprint",
    desc: "Every ingest and sanitized export is hashed with SHA-256 to provide an immutable mathematical fingerprint for public tamper verification.",
  },
  {
    icon: Server,
    title: "Zero-Pixel Leakage Ingress Validation",
    desc: "Strict MIME-type binary inspection rejects malicious polyglot files, payload bombs, and executable scripts at the reverse-proxy boundary.",
  },
  {
    icon: FileKey2,
    title: "Deterministic Forensic Audit Ledger",
    desc: "Every upload, redaction toggle, verification check, and administrative event generates an append-only cryptographic audit record.",
  },
];

export default function SecurityPage() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      <SiteHeader />

      <main className="relative z-10 pt-36 pb-28 md:pt-44 md:pb-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              Security Protocol & Zero Leakage
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white font-heading sm:text-6xl">
              Your Documents. Your Control.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-400 sm:text-base leading-relaxed">
              Designed from the ground up for strict confidentiality, irreversible privacy
              redaction, and verifiable cryptographic proofs.
            </p>
          </div>

          {/* Core Security Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityTenets.map((tenet, idx) => (
              <DoubleBezelCard
                key={idx}
                className="transition-all duration-300 hover:ring-amber-500/30"
                innerClassName="flex h-full flex-col justify-between p-6 md:p-8"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                    <tenet.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-6 text-base font-bold text-white font-heading">
                    {tenet.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                    {tenet.desc}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Enforced at Runtime</span>
                </div>
              </DoubleBezelCard>
            ))}
          </div>

          {/* Safety Boundary Guarantee Banner */}
          <div className="mt-20">
            <DoubleBezelCard
              className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10"
              innerClassName="p-8 md:p-10"
            >
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/20 text-amber-400">
                  <ShieldAlert className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white font-heading">
                    Strict Ethical & Safety Boundary Guarantee
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-300">
                    RakshaDoc AI is designed exclusively to <strong>protect</strong>, <strong>detect</strong>,{" "}
                    <strong>verify</strong>, and <strong>access</strong> documents. It does NOT reproduce signatures,
                    clone government stamps, recreate biometric seals, or generate forged documents.
                    Integrity verification confirms binary file hash match — it does not replace official statutory
                    validation from issuing government authorities.
                  </p>
                </div>
              </div>
            </DoubleBezelCard>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-1.5 pl-6 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(245,158,11,0.6)] active:scale-98"
            >
              <span>Launch Protected Console</span>
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
