import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Research Methodology",
  description: "Indic Document Layout Parsing research overview.",
};

export default function ResearchPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">
              Research & Methodology
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Indic Document Layout Parsing
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Deep Learning Optimization for Multilingual Indian Document Intelligence
            </p>
          </div>

          <Card className="bg-card">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Research Focus Areas
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {[
                  "Document AI",
                  "Document Layout Analysis",
                  "Indic Document Layout Parsing",
                  "Robust Layout Detection",
                  "Deep Learning Optimization",
                ].map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <section id="problem" className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">1. Problem Statement</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Scanned Indian documents present severe challenges for standard document layout analysis
              systems: low resolution, blur, skew, faded ink, shadows, complex multi-column layouts,
              tables, form fields, small signatures and official stamps in various Indian scripts.
            </p>
          </section>

          <section id="gap" className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">2. Research Gap</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Most existing datasets focus on English/Western documents (PubLayNet, DocBank, HJDataset).
              Multilingual Indian documents lack robust benchmarks for combined layout detection,
              authentication element protection and Braille accessibility translation.
            </p>
          </section>

          <section id="dataset" className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">3. Dataset — IndicDLP</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              IndicDLP is our target benchmark dataset covering certificates, government forms,
              newspapers, books, magazines, reports and official documents. Signature and stamp
              detection are evaluated as separate custom data components.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/dataset">
                Explore IndicDLP Dataset <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </section>

          <section id="methodology" className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">4. Methodology & Pipeline</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A six-stage pipeline combining quality estimation, adaptive enhancement, object-detection
              layout parsing, modular OCR, cryptographic hashing and Braille translation.
            </p>
          </section>

          <section id="architecture" className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">5. Model Architecture</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Modular Vision Transformer / Convolutional object detectors with feature pyramid networks.
              Every ML component implements a clean interface enabling seamless replacement of demo
              stubs with trained PyTorch models.
            </p>
          </section>

          <section id="experiments" className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">6. Experiments & Ablation</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Planned experiment configurations evaluate baseline models, enhancement pre-processing,
              data augmentation and model compression. Registered experiment definitions are tracked in
              the Admin workspace.
            </p>
          </section>

          <section id="evaluation" className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">7. Evaluation Metrics</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Layout Detection mAP (IoU 0.5:0.95), Precision, Recall, F1-score, inference time (ms),
              and model size (MB).
            </p>
          </section>

          <section id="results" className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">8. Evaluation Results</h2>
            <Card className="border-warning/40 bg-warning/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Badge variant="demo">Status: Not Evaluated</Badge>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  The deep learning models are currently in development and have not yet been evaluated
                  on the benchmark dataset. System metrics will display evaluated scores once model
                  training and validation rounds complete. Registered experiments can be inspected in
                  the Admin & Research dashboard.
                </p>
              </CardContent>
            </Card>
          </section>

          <section id="limitations" className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">9. Limitations</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tamper-risk assessment is probabilistic. OCR accuracy varies with severe document
              degradation. Integrity hashes apply to exact file byte contents.
            </p>
          </section>

          <section id="future" className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">10. Future Work</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Expanding language support for all scheduled Indian languages, integrating end-to-end
              multimodal Indic Vision-Language models, and running formal usability evaluations for
              Braille output.
            </p>
          </section>

          <div className="pt-6 border-t flex justify-between items-center">
            <Button asChild variant="outline">
              <Link href="/dashboard/admin">
                <FlaskConical className="h-4 w-4" /> Go to Research Dashboard
              </Link>
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
