import type { Metadata } from "next";
import Link from "next/link";
import { Accessibility, ArrowRight, FileScan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Braille translation and accessible document intelligence.",
};

const flow = [
  "DOCUMENT",
  "OCR",
  "LANGUAGE DETECTION",
  "TEXT STRUCTURE",
  "BRAILLE TRANSLATION",
  "⠠⠙⠕⠉⠥⠍⠑⠝⠞",
];

export default function AccessibilityPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">
              Accessibility
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Braille-Ready Document Intelligence
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Making complex Indian documents accessible for visually impaired readers.
            </p>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-2">
            {flow.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={
                    i === flow.length - 1
                      ? "rounded-lg border border-saffron bg-saffron/10 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-accent-foreground"
                      : "rounded-lg border bg-card px-3 py-1.5 text-xs font-bold tracking-wide text-foreground shadow-sm"
                  }
                >
                  {s}
                </span>
                {i < flow.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                )}
              </div>
            ))}
          </div>

          <Card className="mt-16 text-center">
            <CardContent className="p-12">
              <Accessibility className="mx-auto h-12 w-12 text-primary" />
              <p className="mt-6 font-mono text-4xl tracking-widest text-foreground">
                ⠠⠙⠕⠉⠥⠍⠑⠝⠞
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Braille Unicode output (Grade 1 / Bharati Braille formats)
              </p>
              <Button asChild variant="saffron" size="lg" className="mt-8">
                <Link href="/dashboard/analyze">
                  <FileScan className="h-4 w-4" /> Generate Braille
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-base font-bold text-foreground">Structured Reading Flow</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Document elements are ordered logically — title, headings, paragraphs, tables, lists
                  — so screen readers and Braille displays receive a meaningful reading order instead of
                  scrambled OCR fragments.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-base font-bold text-foreground">Bharati Braille & Unicode</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Supports Indian languages including Hindi, Marathi, Tamil, Telugu, Kannada, Gujarati,
                  Bengali, Punjabi, Malayalam, Odia, Urdu and English.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
