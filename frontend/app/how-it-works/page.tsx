import type { Metadata } from "next";
import Link from "next/link";
import {
  Accessibility,
  ArrowDown,
  ArrowRight,
  FileScan,
  Fingerprint,
  Lock,
  ScanSearch,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "How It Works",
  description: "The six-step RakshaDoc AI pipeline.",
};

const steps = [
  {
    num: "01",
    tag: "UPLOAD",
    title: "Upload Document",
    desc: "Upload a PDF or image file (PNG, JPEG, TIFF, WEBP, BMP up to 25 MB). Your original file is stored safely in private storage.",
    icon: Upload,
  },
  {
    num: "02",
    tag: "ENHANCE",
    title: "Quality & Enhancement",
    desc: "The system assesses quality score and applies image cleanup (deskew, binarization, noise reduction) if needed.",
    icon: Sparkles,
  },
  {
    num: "03",
    tag: "UNDERSTAND",
    title: "Layout & Text Analysis",
    desc: "Deep learning models detect titles, headings, paragraphs, tables, figures, lists, signatures, stamps, seals, logos and QR codes.",
    icon: ScanSearch,
  },
  {
    num: "04",
    tag: "PROTECT",
    title: "Sensitive Element Protection",
    desc: "Detected signatures and official stamps are marked. Choose permanent redaction, blur, pixelation or masking to generate a shareable copy.",
    icon: Lock,
  },
  {
    num: "05",
    tag: "VERIFY",
    title: "Integrity & Tamper Risk",
    desc: "A SHA-256 cryptographic hash is generated to confirm file integrity. Suspicions are evaluated to assign LOW, MEDIUM or HIGH tamper risk.",
    icon: Fingerprint,
  },
  {
    num: "06",
    tag: "ACCESS",
    title: "Structured Text & Braille",
    desc: "Extracted text is structured into paragraphs and translated into Braille Unicode (.brf / .txt) for screen readers and refreshable Braille displays.",
    icon: Accessibility,
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">
              Workflow
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Transparent Six-Step Pipeline
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              From raw document upload to verified, protected and accessible output.
            </p>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-2">
            {["UPLOAD", "ENHANCE", "UNDERSTAND", "PROTECT", "VERIFY", "ACCESS"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className="rounded-lg border bg-card px-3 py-1.5 text-xs font-bold tracking-wide text-foreground shadow-sm">
                  {s}
                </span>
                {i < 5 && <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />}
              </div>
            ))}
          </div>

          <div className="mt-16 space-y-6">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                <Card>
                  <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="saffron">{step.tag}</Badge>
                        <span className="font-mono text-sm font-bold text-muted-foreground">
                          {step.num}
                        </span>
                      </div>
                      <h2 className="mt-2 text-xl font-bold text-foreground">{step.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                {i < steps.length - 1 && (
                  <div className="my-2 flex justify-center text-muted-foreground">
                    <ArrowDown className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button asChild variant="saffron" size="lg">
              <Link href="/dashboard/analyze">
                <FileScan className="h-4 w-4" /> Try It Now
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
