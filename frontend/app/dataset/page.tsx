import type { Metadata } from "next";
import Link from "next/link";
import { Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "IndicDLP Dataset",
  description: "Multilingual Indian Document Layout Parsing benchmark dataset.",
};

const categories = [
  "Certificates & Marksheets",
  "Government Forms & Applications",
  "Newspapers & Gazette Notifications",
  "Books & Manuscripts",
  "Magazines & Periodicals",
  "Reports & Official Letters",
  "Legal Documents & Contracts",
];

export default function DatasetPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">
              Dataset Benchmark
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              IndicDLP Dataset
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Multilingual Indian Document Layout Parsing benchmark dataset.
            </p>
          </div>

          <Card className="bg-card">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Dataset Overview</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                IndicDLP is designed to evaluate layout parsing algorithms across diverse Indian document
                categories and scripts. Annotations specify normalized bounding boxes for titles,
                headings, paragraphs, tables, figures, lists, logos and text blocks.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Document Categories</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((c) => (
                <Card key={c}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">{c}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-saffron/40 bg-card">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="saffron">Important Note</Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Signature and official stamp detection are trained and evaluated as separate, custom data
                components distinct from the general layout parsing benchmark to preserve security and
                privacy boundaries.
              </p>
            </CardContent>
          </Card>

          <div className="pt-6 border-t flex justify-between items-center">
            <Button asChild variant="outline">
              <Link href="/research">Back to Research</Link>
            </Button>
            <Button asChild variant="saffron">
              <Link href="/dashboard/analyze">Analyze a Document</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
