import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "RakshaDoc AI Privacy Policy.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <Badge variant="secondary" className="mb-3">
              Legal
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: 2026</p>
          </div>

          <Card>
            <CardContent className="p-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
              <section className="space-y-2">
                <h2 className="text-base font-bold text-foreground">1. Document Processing & Storage</h2>
                <p>
                  Documents uploaded to RakshaDoc AI are stored in private storage accessible only by
                  authorized accounts. Original uploaded files are preserved and never overwritten.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-foreground">2. Sensitive Element Protection</h2>
                <p>
                  Shareable copies generated using Permanent Redaction remove underlying sensitive pixels
                  completely. No reusable signature or stamp assets are intentionally extracted or saved.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-foreground">3. Configurable Retention & Deletion</h2>
                <p>
                  Documents are retained for a configurable period (default 90 days). Users can permanently
                  delete their uploaded documents at any time from the My Documents workspace.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-foreground">4. Security Guarantees</h2>
                <p>
                  We do not make unsupported claims of &quot;100% security&quot;. Integrity verification confirms
                  file-level byte consistency using SHA-256 and does not certify legal authenticity.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
