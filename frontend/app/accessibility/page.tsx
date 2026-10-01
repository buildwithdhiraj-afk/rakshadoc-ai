import type { Metadata } from "next";
import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  FileScan,
  FileText,
  Glasses,
  HardDrive,
  Languages,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DoubleBezelCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Bharati Braille Accessibility Engine",
  description:
    "Convert complex Indic documents into structured Bharati Braille Grade 1 and Unicode dot matrices for screen readers and refreshable Braille hardware.",
};

const brailleChars = [
  { char: "अ", braille: "⠁", desc: "Short A" },
  { char: "आ", braille: "⠜", desc: "Long A" },
  { char: "क", braille: "⠅", desc: "Ka" },
  { char: "ख", braille: "⠨", desc: "Kha" },
  { char: "ग", braille: "⠛", desc: "Ga" },
  { char: "म", braille: "⠍", desc: "Ma" },
  { char: "र", braille: "⠗", desc: "Ra" },
  { char: "स", braille: "⠎", desc: "Sa" },
];

export default function AccessibilityPage() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      <SiteHeader />

      <main className="relative z-10 pt-36 pb-28 md:pt-44 md:pb-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              Sensory Inclusion · Bharati Braille G1
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white font-heading sm:text-6xl">
              Braille-Ready Indic Intelligence.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-400 sm:text-base leading-relaxed">
              Transforming complex multi-column Indian government certificates into structured,
              screen-reader accessible reading flows and standard 6-dot Unicode Braille.
            </p>
          </div>

          {/* Interactive Braille Matrix Terminal */}
          <div className="mt-20">
            <DoubleBezelCard
              className="mx-auto max-w-4xl shadow-[0_25px_70px_rgba(0,0,0,0.8)]"
              innerClassName="p-8 md:p-12 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
                <Glasses className="h-7 w-7" strokeWidth={1.5} />
              </div>

              <p className="mt-6 font-mono text-5xl md:text-6xl tracking-widest text-purple-300">
                ⠍⠓⠁⠗⠁⠎⠓⠞⠗⠁
              </p>

              <p className="mt-3 font-mono text-xs text-slate-400 uppercase tracking-widest">
                Devanagari "महाराष्ट्र" mapped to Bharati Braille Grade 1
              </p>

              {/* Sample Cell Cards */}
              <div className="mt-10 grid grid-cols-4 sm:grid-cols-8 gap-3">
                {brailleChars.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-3"
                  >
                    <span className="text-xl font-bold text-white">{item.char}</span>
                    <span className="mt-1 font-mono text-2xl text-purple-400">{item.braille}</span>
                    <span className="mt-1 text-[9px] font-mono text-slate-400">{item.desc}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex justify-center">
                <Link
                  href="/dashboard/analyze"
                  className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 p-1.5 pl-6 text-xs font-semibold text-slate-950 shadow-[0_0_25px_rgba(168,85,247,0.35)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] active:scale-98"
                >
                  <span>Synthesize Braille for Your Document</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/20 text-slate-950 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                </Link>
              </div>
            </DoubleBezelCard>
          </div>

          {/* Key Advantages */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
            <DoubleBezelCard innerClassName="p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white font-heading">
                  Syntactic Reading Hierarchy
                </h3>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-400">
                Instead of dumping chaotic, unorganized OCR text strings, RakshaDoc performs morphological
                reading-flow ordering (Header &gt; Issuer &gt; Beneficiary &gt; Legal Clauses &gt; Seals)
                so that blind users navigating with screen readers or refreshable Braille displays experience
                a logical, intuitive document narrative.
              </p>
            </DoubleBezelCard>

            <DoubleBezelCard innerClassName="p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                  <Languages className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white font-heading">
                  All 22 Official Indian Scripts
                </h3>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-400">
                Built-in translation tables cover Devanagari (Hindi, Marathi, Sanskrit), Bengali, Tamil,
                Telugu, Kannada, Gujarati, Malayalam, Odia, Punjabi, Urdu, and Latin English based on the
                National Bharati Braille Standard.
              </p>
            </DoubleBezelCard>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
