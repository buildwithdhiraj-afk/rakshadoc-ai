"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Accessibility, Copy, Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import type { BrailleOutput, Document } from "@/types";

const LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
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

function downloadText(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function BrailleContent() {
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [language, setLanguage] = useState("Hindi");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<BrailleOutput | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let ignore = false;
    api
      .listDocuments()
      .then((docs) => {
        if (ignore) return;
        setDocuments(docs);
        const fromParam = searchParams.get("doc");
        if (fromParam && docs.some((d) => d.id === fromParam)) {
          setSelectedId(fromParam);
        } else if (docs.length > 0) {
          setSelectedId(docs[0].id);
        }
      })
      .catch((err) => {
        if (!ignore) setError(err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [searchParams]);

  async function generate() {
    if (!selectedId) return;
    setError(null);
    setGenerating(true);
    setOutput(null);
    try {
      setOutput(await api.getBraille(selectedId, language));
    } catch (err) {
      setError(err);
    } finally {
      setGenerating(false);
    }
  }

  async function copyBraille() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output.braille_unicode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Braille Output</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Convert extracted text into accessible Braille-ready output.
        </p>
      </div>

      {error ? <ErrorState error={error} onRetry={() => setError(null)} title="Braille generation failed" /> : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={Accessibility}
          title="No documents available"
          description="Upload and process a document first, then generate Braille output for it."
          action="Analyze a Document"
          actionHref="/dashboard/analyze"
        />
      ) : (
        <>
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="braille-doc">Document</Label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger id="braille-doc">
                      <SelectValue placeholder="Select a document" />
                    </SelectTrigger>
                    <SelectContent>
                      {documents.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.original_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="braille-lang">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="braille-lang">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="saffron" className="w-full sm:w-auto" onClick={generate} disabled={generating || !selectedId}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Accessibility className="h-4 w-4" />}
                {generating ? "Generating…" : "Generate Braille"}
              </Button>
            </CardContent>
          </Card>

          {output && (
            <>
              <Card>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">Braille Output</CardTitle>
                    <CardDescription className="text-xs">
                      {output.language} · {output.braille_bytes} bytes
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {output.source === "demo" && (
                      <Badge variant="demo">
                        <Sparkles className="h-3 w-3" /> Demo
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-auto rounded-lg border bg-muted/40 p-5">
                    <p className="whitespace-pre-wrap break-words font-mono text-2xl leading-loose text-foreground">
                      {output.braille_unicode}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={copyBraille}>
                      {copied ? <Copy className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy Braille"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadText(output.braille_unicode, "braille-output.brf")}
                    >
                      <Download className="h-4 w-4" /> Download Braille (.brf)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadText(output.extracted_text, "extracted-text.txt")}
                    >
                      <Download className="h-4 w-4" /> Download TXT
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Extracted Text</CardTitle>
                  <CardDescription className="text-xs">
                    Structured paragraphs used for the Braille translation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {output.extracted_text ? (
                    <div className="max-h-80 space-y-3 overflow-auto rounded-lg border bg-muted/40 p-4">
                      {output.extracted_text
                        .split(/\n{2,}/)
                        .map((p, i) =>
                          p.trim() ? (
                            <p key={i} className="text-sm leading-relaxed text-foreground">
                              {p.trim()}
                            </p>
                          ) : null,
                        )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No extracted text available.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function BraillePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[60vh] w-full" />}>
      <BrailleContent />
    </Suspense>
  );
}
