import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileScan, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Security & Privacy",
  description: "Your documents. Your control.",
};

const bullets = [
  {
    title: "Original Preservation",
    desc: "Original uploaded documents are stored in private storage and are never overwritten during protection.",
  },
  {
    title: "Sensitive Element Protection",
    desc: "Signatures, official stamps, seals and QR codes are detected and protected in shareable copies.",
  },
  {
    title: "Secure Processing",
    desc: "Documents live in private storage. Temporary access is issued via signed owner-only links.",
  },
  {
    title: "Integrity Verification",
    desc: "SHA-256 document hashing records file integrity so any modification can be detected.",
  },
  {
    title: "Access Control",
    desc: "Owner isolation ensures users can access only their own authorized documents.",
  },
  {
    title: "Audit Trail",
    desc: "Important processing events are recorded in an audit trail for transparency.",
  },
];

const chain = [
  "DOCUMENT",
  "AI ANALYSIS",
  "SENSITIVE ELEMENT DETECTION",
  "PROTECTION",
  "HASH",
  "VERIFICATION",
  "SECURE OUTPUT",
];

export default function SecurityPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-3">
              Security & Privacy
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Your Documents. Your Control.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Built with privacy by design — originals are protected and sensitive elements are
              secured.
            </p>
          </div>

          <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              {bullets.map((b) => (
                <div key={b.title} className="flex items-start gap-4">
                  <div className="mt-1 rounded-lg bg-primary/5 p-2 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">{b.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Card>
              <CardContent className="p-8">
                <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Security Pipeline Chain
                </p>
                <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                  {chain.map((step, i) => (
                    <div key={step} className="flex w-full flex-col items-center">
                      <div className="flex w-full items-center justify-center rounded-lg border bg-card px-4 py-3 text-center text-xs font-bold tracking-wide text-foreground shadow-sm">
                        {step}
                      </div>
                      {i < chain.length - 1 && (
                        <ArrowRight className="my-1 h-4 w-4 rotate-90 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-16 border-saffron/40 bg-card">
            <CardContent className="p-8">
              <h2 className="text-xl font-bold text-foreground">Safety Boundary Guarantee</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                RakshaDoc AI is designed strictly to <strong>protect</strong>, <strong>detect</strong>,{" "}
                <strong>verify</strong> and <strong>access</strong> documents. It does NOT reproduce
                signatures, clone signatures, recreate official stamps, or forge documents. It does not
                claim 100% security or legal certification of authenticity.
              </p>
            </CardContent>
          </Card>

          <div className="mt-12 text-center">
            <Button asChild variant="saffron" size="lg">
              <Link href="/dashboard/analyze">
                <FileScan className="h-4 w-4" /> Start Analyzing
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
