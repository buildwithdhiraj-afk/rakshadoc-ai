import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileScan,
  Fingerprint,
  Languages,
  Lock,
  ScanSearch,
  Shield,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SampleDocument } from "@/components/landing/sample-document";

const workflowSteps = [
  { num: "01", title: "Upload", desc: "Upload PDF or image.", icon: Upload },
  { num: "02", title: "Enhance", desc: "Improve document quality.", icon: Sparkles },
  { num: "03", title: "Understand", desc: "Detect layout and extract text.", icon: ScanSearch },
  { num: "04", title: "Protect", desc: "Detect and protect sensitive elements.", icon: Lock },
  { num: "05", title: "Verify", desc: "Check integrity and tamper risk.", icon: Fingerprint },
  { num: "06", title: "Access", desc: "Structured text and Braille output.", icon: Accessibility },
];

const features = [
  {
    icon: FileScan,
    title: "Document Intelligence",
    desc: "Detect titles, headings, paragraphs, tables, figures, lists, signatures, stamps, seals, logos and QR codes.",
  },
  {
    icon: Lock,
    title: "Sensitive Element Protection",
    desc: "Automatically detect sensitive authentication elements and protect them in shareable copies.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Redaction",
    desc: "Remove the underlying sensitive pixels — not just a visual overlay. Permanent Redaction, Blur, Pixelation and Mask modes.",
  },
  {
    icon: Fingerprint,
    title: "Integrity Verification",
    desc: "SHA-256 document hashing confirms the exact file has not changed since the hash was recorded.",
  },
  {
    icon: ScanSearch,
    title: "Tamper Risk Analysis",
    desc: "Analyze suspicious indicators and return a LOW, MEDIUM or HIGH risk score.",
  },
  {
    icon: Languages,
    title: "Multilingual OCR",
    desc: "Extract text from supported Indian languages with automatic language detection.",
  },
  {
    icon: Accessibility,
    title: "Braille Accessibility",
    desc: "Convert extracted text into Braille-ready output — Braille Unicode, TXT and supported formats.",
  },
  {
    icon: Shield,
    title: "Privacy by Design",
    desc: "Originals are never overwritten. Sensitive documents are never exposed through public URLs.",
  },
];

const trustItems = [
  { icon: Sparkles, title: "AI-Powered", desc: "Document Intelligence" },
  { icon: Lock, title: "Secure", desc: "Sensitive Element Protection" },
  { icon: BadgeCheck, title: "Verified", desc: "Cryptographic Integrity" },
  { icon: Accessibility, title: "Accessible", desc: "Braille-Ready Output" },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <TrustBar />
        <ProblemSection />
        <WorkflowSection />
        <FeaturesSection />
        <SecuritySection />
        <AccessibilitySection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-card">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-saffron/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <Badge variant="demo" className="mb-5">
            <Sparkles className="h-3 w-3" /> AI-Powered Document Intelligence
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Protect Every Document.{" "}
            <span className="text-primary">Understand Every Detail.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            RakshaDoc AI uses computer vision and deep learning to understand multilingual Indian
            documents, protect sensitive authentication elements, verify document integrity and make
            document content more accessible.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="saffron" size="lg">
              <Link href="/dashboard/analyze">
                Analyze a Document <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/how-it-works">Explore How It Works</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" /> PDF · PNG · JPG · TIFF
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" /> Hindi · Marathi · English · Tamil · Telugu
            </span>
          </div>
        </div>
        <SampleDocument className="mx-auto w-full max-w-md" />
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-b bg-card" aria-label="Platform guarantees">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
        {trustItems.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/5 p-2.5 text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-3">
            The Challenge
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Indian Documents Are Complex
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Scanned Indian documents can contain low resolution, blur, skew, faded ink, shadows,
            compression artifacts, multiple scripts, complex layouts, small signatures, official
            stamps, tables and forms — all in a single page.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Raw Scan</p>
                <Badge variant="destructive">Degraded</Badge>
              </div>
              <svg viewBox="0 0 320 240" className="w-full rounded-lg border border-border bg-[#efedeb]" aria-label="Raw degraded document scan preview">
                <g opacity="0.85" transform="rotate(-1.5 160 120)">
                  <rect width="320" height="240" fill="#dedbd6" />
                  <rect x="28" y="24" width="264" height="192" fill="#f4f1ec" stroke="#b7b0a6" strokeWidth="2" />
                  <rect x="50" y="44" width="160" height="10" fill="#b9b2a6" />
                  <rect x="50" y="64" width="220" height="5" fill="#c8c1b4" />
                  <rect x="50" y="76" width="200" height="5" fill="#c8c1b4" />
                  <rect x="50" y="88" width="90" height="56" fill="#dcd5c8" stroke="#b7b0a6" />
                  <rect x="150" y="88" width="118" height="56" fill="#efeae2" stroke="#b7b0a6" />
                  <rect x="50" y="156" width="60" height="24" fill="#d8d0c2" />
                  <circle cx="226" cy="168" r="22" fill="#e3ddd2" stroke="#b7b0a6" strokeDasharray="4 3" />
                </g>
                <rect x="0" y="0" width="320" height="240" fill="url(#shade)" opacity="0.5" />
                <defs>
                  <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#000" stopOpacity="0.08" />
                    <stop offset="50%" stopColor="#000" stopOpacity="0" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
              </svg>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">AI-Enhanced Document</p>
                <Badge variant="success">Enhanced</Badge>
              </div>
              <svg viewBox="0 0 320 240" className="w-full rounded-lg border border-border bg-white" aria-label="AI enhanced document preview">
                <rect width="320" height="240" fill="#fff" />
                <rect x="28" y="24" width="264" height="192" fill="#fdfcfb" stroke="#d6dde6" strokeWidth="2" />
                <rect x="50" y="44" width="160" height="10" fill="#1e3a5f" />
                <rect x="50" y="64" width="220" height="5" fill="#8b9bb0" />
                <rect x="50" y="76" width="200" height="5" fill="#8b9bb0" />
                <rect x="50" y="88" width="90" height="56" fill="#eef2f7" stroke="#c7d0db" />
                <rect x="150" y="88" width="118" height="56" fill="#f8f6f3" stroke="#d6dde6" />
                <rect x="50" y="156" width="60" height="24" fill="#e5ecf5" />
                <circle cx="226" cy="168" r="22" fill="none" stroke="#94a3b8" strokeDasharray="4 3" />
              </svg>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="bg-card py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-3">
            The Process
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How RakshaDoc AI Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A transparent six-step pipeline from upload to accessible output.
          </p>
        </div>

        <div className="relative mt-14">
          <div className="absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 border-t border-dashed border-border lg:block" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
            {workflowSteps.map((step, i) => (
              <div key={step.num} className="relative">
                <div className="rounded-xl border bg-background p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-saffron">{step.num}</span>
                    <span className="rounded-md bg-primary/5 p-1.5 text-primary">
                      <step.icon className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {i < workflowSteps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-muted-foreground lg:block">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-3">
            Capabilities
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything a Document Needs
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From structure to security to accessibility — in one pipeline.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="rounded-lg bg-primary/5 p-2.5 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-foreground">
            <Lock className="h-4 w-4 text-success" /> Signature Protected
          </span>
          <span className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-foreground">
            <Lock className="h-4 w-4 text-success" /> Official Stamp Protected
          </span>
          <span className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-foreground">
            <Fingerprint className="h-4 w-4 text-success" /> SHA-256 Verified
          </span>
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  const chain = ["DOCUMENT", "AI ANALYSIS", "SENSITIVE ELEMENT DETECTION", "PROTECTION", "HASH", "VERIFICATION", "SECURE OUTPUT"];
  return (
    <section className="bg-card py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="secondary" className="mb-3">
              Security
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your Documents. Your Control.
            </h2>
            <ul className="mt-6 space-y-3">
              {[
                ["Original Preservation", "Original documents are never overwritten during protection."],
                ["Sensitive Element Protection", "Signatures and official stamps are protected from unauthorized reuse."],
                ["Secure Processing", "Sensitive documents are never exposed through public URLs."],
                ["Integrity Verification", "SHA-256 hashing provides file-integrity verification."],
                ["Access Control", "Users can access only documents authorized for them."],
                ["Audit Trail", "Important document-processing events are recorded."],
              ].map(([t, d]) => (
                <li key={t} className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t}</p>
                    <p className="text-sm text-muted-foreground">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border bg-background p-6 shadow-sm">
            <div className="mx-auto flex max-w-sm flex-col items-center gap-0">
              {chain.map((step, i) => (
                <div key={step} className="flex w-full flex-col items-center">
                  <div className="flex w-full items-center justify-center rounded-lg border bg-card px-4 py-3 text-center text-sm font-semibold text-foreground shadow-sm">
                    {step}
                  </div>
                  {i < chain.length - 1 && (
                    <div className="flex h-8 items-center justify-center text-muted-foreground">
                      <ArrowRight className="h-4 w-4 -rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AccessibilitySection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-3">
            Accessibility
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Make Documents Accessible to Everyone
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            RakshaDoc AI extracts structured document content and can convert supported text into
            Braille output.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["DOCUMENT", "OCR", "LANGUAGE DETECTION", "TEXT STRUCTURE", "BRAILLE TRANSLATION"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className="rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold text-foreground">
                  {s}
                </span>
                {i < 4 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl border bg-card p-8 text-center shadow-sm">
            <Accessibility className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-4 text-2xl tracking-widest text-foreground">⠠⠙⠕⠉⠥⠍⠑⠝⠞</p>
            <p className="mt-2 text-sm text-muted-foreground">Braille output preview</p>
            <Button asChild variant="saffron" className="mt-5">
              <Link href="/dashboard/analyze">Generate Braille</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="border-t bg-primary py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
          Ready to Understand and Protect Your Documents?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
          Upload a document to see layout detection, sensitive-element protection, integrity
          verification and Braille output in action.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="saffron" size="lg">
            <Link href="/dashboard/analyze">
              <FileScan className="h-4 w-4" /> Analyze a Document
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="border border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link href="/research">Read the Research</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
