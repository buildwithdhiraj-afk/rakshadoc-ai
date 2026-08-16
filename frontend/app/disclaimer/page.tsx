import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIDisclaimer } from "@/components/ai-disclaimer";

export const metadata: Metadata = {
  title: "AI Disclaimer",
  description: "RakshaDoc AI Disclaimer.",
};

export default function DisclaimerPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <Badge variant="secondary" className="mb-3">
              Legal
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Full AI Disclaimer</h1>
          </div>

          <AIDisclaimer />

          <Card>
            <CardContent className="p-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <h2 className="text-base font-bold text-foreground">Important Notice</h2>
              <p>
                RakshaDoc AI provides AI-assisted document analysis, privacy protection and integrity
                verification. Tamper-risk results are probabilistic and are not legal proof of forgery
                or authenticity.
              </p>
              <p>
                Official or legal verification should be performed through the relevant authoritative
                institution or certified legal authority.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
