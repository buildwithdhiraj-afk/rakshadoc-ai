import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "RakshaDoc AI Terms of Service.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <Badge variant="secondary" className="mb-3">
              Legal
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: 2026</p>
          </div>

          <Card>
            <CardContent className="p-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
              <section className="space-y-2">
                <h2 className="text-base font-bold text-foreground">1. Acceptable Use</h2>
                <p>
                  RakshaDoc AI is designed strictly to protect, detect, verify and access document content.
                  You agree not to use the service for document forgery, signature reproduction, stamp
                  cloning, or any unlawful activity.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-foreground">2. Probabilistic Analysis Disclaimer</h2>
                <p>
                  Tamper risk scoring and layout detection are probabilistic output of AI models. Results
                  do not constitute legal certification or definitive proof of document authenticity or
                  forgery.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-foreground">3. Retention & User Deletion</h2>
                <p>
                  Users maintain control of their documents and may trigger permanent deletion at any time.
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
