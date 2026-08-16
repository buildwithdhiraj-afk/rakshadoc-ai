import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AIDisclaimer } from "@/components/ai-disclaimer";

export const metadata: Metadata = {
  title: "About",
  description: "About RakshaDoc AI.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">
              About
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              RakshaDoc AI
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Secure and Accessible AI-Powered Document Intelligence for Multilingual Indian
              Documents.
            </p>
          </div>

          <Card className="bg-card">
            <CardContent className="p-8 space-y-4">
              <h2 className="text-xl font-bold text-foreground">Vision & Purpose</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                RakshaDoc AI addresses the real-world complexity of scanned Indian documents. By
                combining document layout analysis, computer vision, multilingual OCR, privacy-preserving
                redaction, cryptographic integrity verification and Braille translation into a unified
                pipeline, RakshaDoc AI makes document intelligence both secure and accessible.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Core Guiding Principles</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Protect", "Keep sensitive authentication elements safe in shareable copies."],
                ["Detect", "Locate titles, headings, tables, signatures and stamps accurately."],
                ["Verify", "Provide cryptographic proof of file integrity with SHA-256 hashes."],
                ["Access", "Translate document text into accessible Braille Unicode formats."],
              ].map(([t, d]) => (
                <Card key={t}>
                  <CardContent className="p-6">
                    <h3 className="text-base font-bold text-foreground">{t}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-border bg-card">
            <CardContent className="p-8 space-y-3">
              <h2 className="text-xl font-bold text-foreground">MCA Major Project & Research Context</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Developed as a Master of Computer Applications (MCA) major project focusing on Indic
                Document Layout Parsing, privacy engineering, and accessible human-computer interaction.
              </p>
            </CardContent>
          </Card>

          <AIDisclaimer />

          <div className="text-center pt-4">
            <Button asChild variant="saffron" size="lg">
              <Link href="/dashboard/analyze">Analyze a Document</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
