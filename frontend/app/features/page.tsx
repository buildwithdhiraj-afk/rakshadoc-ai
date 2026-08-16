import type { Metadata } from "next";
import Link from "next/link";
import {
  Accessibility,
  FileScan,
  Fingerprint,
  Languages,
  Lock,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore the capabilities of RakshaDoc AI.",
};

const layoutItems = [
  "Title",
  "Heading",
  "Paragraph",
  "Table",
  "Figure",
  "List",
  "Signature",
  "Official Stamp",
  "Seal",
  "Logo",
  "QR Code",
];

const languages = [
  "Hindi",
  "Marathi",
  "English",
  "Tamil",
  "Telugu",
  "Kannada",
  "Gujarati",
  "Bengali",
  "Punjabi",
  "Malayalam",
  "Odia",
  "Urdu",
];

export default function FeaturesPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3">
              Capabilities
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Built for Complex Indian Documents
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything needed to understand structure, protect sensitive elements, verify
              integrity and extract accessible content.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <FileScan className="h-8 w-8 text-primary" />
                <h2 className="mt-4 text-xl font-bold">Document Intelligence</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Detect layout categories with spatial bounding box coordinates across single and
                  multi-page documents.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {layoutItems.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Lock className="h-8 w-8 text-primary" />
                <h2 className="mt-4 text-xl font-bold">Sensitive Element Protection</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Detect authentication components and generate shareable copies where sensitive
                  pixels are removed or masked.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 rounded-md border bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
                    <Lock className="h-3.5 w-3.5 text-success" /> Signature Protected
                  </span>
                  <span className="flex items-center gap-1 rounded-md border bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
                    <Lock className="h-3.5 w-3.5 text-success" /> Official Stamp Protected
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h2 className="mt-4 text-xl font-bold">Secure Redaction</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Multiple protection methods available. Permanent Redaction removes underlying
                  pixels completely.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Badge variant="default">Permanent Redaction (default)</Badge>
                  <Badge variant="outline">Blur</Badge>
                  <Badge variant="outline">Pixelation</Badge>
                  <Badge variant="outline">Mask</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Fingerprint className="h-8 w-8 text-primary" />
                <h2 className="mt-4 text-xl font-bold">Integrity Verification</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  SHA-256 document hashing records file integrity. Verify against the original hash
                  at any time.
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Confirms recorded file integrity — not a legal proof of authenticity.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <ScanSearch className="h-8 w-8 text-primary" />
                <h2 className="mt-4 text-xl font-bold">Tamper Risk Analysis</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Evaluates document indicators to return a LOW, MEDIUM or HIGH risk score with
                  detailed reasons.
                </p>
                <div className="mt-4 flex gap-2">
                  <Badge variant="success">LOW</Badge>
                  <Badge variant="warning">MEDIUM</Badge>
                  <Badge variant="destructive">HIGH</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Languages className="h-8 w-8 text-primary" />
                <h2 className="mt-4 text-xl font-bold">Multilingual OCR</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Automatic language detection and text extraction across supported Indian
                  languages.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {languages.map((l) => (
                    <Badge key={l} variant="outline" className="text-[11px]">
                      {l}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-12 bg-card">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h3 className="text-xl font-bold">Braille Accessibility</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Convert extracted document text into Braille Unicode, TXT and Braille-ready
                  formats.
                </p>
              </div>
              <Button asChild variant="saffron">
                <Link href="/dashboard/analyze">
                  <Accessibility className="h-4 w-4" /> Generate Braille
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
