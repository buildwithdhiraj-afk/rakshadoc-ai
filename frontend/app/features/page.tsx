import type { Metadata } from "next";
import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  ArrowUpRight,
  Cpu,
  FileScan,
  Fingerprint,
  HardDrive,
  Hash,
  Languages,
  Layers,
  Lock,
  Scan,
  ScanSearch,
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
  title: "Platform Capabilities",
  description:
    "Explore the deep computer vision, sensitive element detection, cryptographic verification and Braille accessibility features of RakshaDoc AI.",
};

const featureCards = [
  {
    icon: ScanSearch,
    category: "Computer Vision & Layout",
    title: "Multilingual Layout Segmentation",
    description:
      "Proprietary contour analysis and adaptive Otsu/Sauvola binarization decompose multi-column Indian government certificates, stamp regions, and tables with sub-millimeter precision.",
    specs: ["Morphological kernel segmentation", "DPI & quality scoring", "Perspective deskewing"],
  },
  {
    icon: Languages,
    category: "Indic OCR Engine",
    title: "Polyglot Indic Character Recognition",
    description:
      "Trained on official Indian administrative lexicons. Recognizes mixed Devanagari, Marathi, Hindi, Tamil, Bengali, Telugu, and Latin scripts simultaneously.",
    specs: ["Unicode UTF-8 extraction", "Confidence score heatmaps", "Token bounding boxes"],
  },
  {
    icon: Fingerprint,
    category: "Biometric & Auth Protection",
    title: "Sensitive Authentication Seal Detection",
    description:
      "Heuristic computer vision detects official municipal rubber stamps, physical registrar signatures, QR matrices, Aadhaar masks, and PAN IDs.",
    specs: ["Geometric aspect-ratio filters", "Signature contour tracking", "Confidence gating (>85%)"],
  },
  {
    icon: ShieldLock,
    category: "Cryptographic Privacy",
    title: "Permanent Zero-Pixel Redaction",
    description:
      "True raster-level pixel overwriting in Pillow memory. Erases underlying raw pixel data so redactions cannot be reversed by inspection tools or layer analyzers.",
    specs: ["Pillow zero-fill array write", "Selective Gaussian blur", "Residual metadata purge"],
  },
  {
    icon: Hash,
    category: "Integrity & Anti-Tamper",
    title: "Immutable SHA-256 Fingerprinting",
    description:
      "Generates an immutable cryptographic hash of original documents before and after processing. Enables public verification portals to detect single-pixel modifications.",
    specs: ["FIPS 180-4 compliant SHA-256", "Public verification tokens", "Audit trail timestamps"],
  },
  {
    icon: Accessibility,
    category: "Universal Accessibility",
    title: "Bharati Braille Grade 1 Synthesis",
    description:
      "Translates extracted multilingual text into standardized 6-dot Unicode Braille matrices and exportable formatted Braille streams for blind and low-vision individuals.",
    specs: ["Latin & Indic mapping", "Unicode Braille patterns", "Embosser ready TXT/BRF"],
  },
];

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      <SiteHeader />

      <main className="relative z-10 pt-36 pb-28 md:pt-44 md:pb-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              Core Capabilities
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white font-heading sm:text-6xl">
              Engineered for High-Assurance Intelligence.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-400 sm:text-base leading-relaxed">
              Every layer of RakshaDoc AI is designed around accuracy, zero-pixel data leakage,
              verifiable cryptographic integrity, and sensory accessibility.
            </p>
          </div>

          {/* Grid of Double-Bezel Feature Cards */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feat, idx) => (
              <DoubleBezelCard
                key={idx}
                className="transition-transform duration-300 hover:-translate-y-1"
                innerClassName="flex h-full flex-col justify-between p-6 md:p-8"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                      <feat.icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <Badge variant="outline" className="text-[9px]">
                      {feat.category}
                    </Badge>
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-white font-heading">
                    {feat.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-8 border-t border-white/[0.06] pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    Key Specifications:
                  </p>
                  <ul className="mt-2 space-y-1.5 font-mono text-[11px] text-slate-300">
                    {feat.specs.map((spec, sIdx) => (
                      <li key={sIdx} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-amber-400" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </DoubleBezelCard>
            ))}
          </div>

          {/* Bottom Interactive Showcase Banner */}
          <div className="mt-20">
            <DoubleBezelCard
              className="bg-gradient-to-r from-amber-500/10 via-white/[0.02] to-transparent ring-amber-500/20"
              innerClassName="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white font-heading">
                  Ready to test with your documents?
                </h3>
                <p className="max-w-xl text-xs text-slate-400">
                  Upload certificates, identity records, or land deeds to inspect real-time layout
                  segmentation, seal protection, and Braille translation.
                </p>
              </div>

              <Link
                href="/register"
                className="group relative inline-flex shrink-0 items-center gap-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 p-1.5 pl-6 text-xs font-semibold text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] active:scale-98"
              >
                <span>Launch Workspace</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/20 text-slate-950 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                </span>
              </Link>
            </DoubleBezelCard>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
