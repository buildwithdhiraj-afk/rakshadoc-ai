"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, Loader2, Lock, ShieldPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/error-state";
import { AIDisclaimer } from "@/components/ai-disclaimer";
import { api, protectedCopyUrl, signedUrl } from "@/lib/api";
import type { ProtectedCopy, ProtectionMethod } from "@/types";

const levels = [
  { value: "standard" as const, title: "Standard", desc: "Protect the selected sensitive elements." },
  { value: "high" as const, title: "High", desc: "Aggressive protection of all sensitive regions." },
];

const methods: { value: ProtectionMethod; title: string; desc: string }[] = [
  { value: "redact", title: "Permanent Redaction", desc: "Removes the underlying sensitive pixels." },
  { value: "blur", title: "Blur", desc: "Softens the region so details are unreadable." },
  { value: "pixelate", title: "Pixelation", desc: "Coarse pixel blocks hide the content." },
  { value: "mask", title: "Mask", desc: "Covers the region with a solid mask." },
];

const elements = [
  { value: "signature", label: "Signatures" },
  { value: "stamp", label: "Official Stamps" },
  { value: "seal", label: "Seals" },
  { value: "qr_code", label: "QR Codes" },
  { value: "barcode", label: "Barcodes" },
  { value: "personal_info", label: "Selected Personal Information" },
];

const DEFAULT_ELEMENTS = ["signature", "stamp", "seal", "qr_code", "barcode"];

function ProtectContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const docId = id ?? searchParams.get("doc");

  const [docName, setDocName] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [level, setLevel] = useState<"standard" | "high">("high");
  const [method, setMethod] = useState<ProtectionMethod>("redact");
  const [selected, setSelected] = useState<string[]>(DEFAULT_ELEMENTS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<ProtectedCopy | null>(null);

  useEffect(() => {
    if (!docId) return;
    api
      .getDocument(docId)
      .then((d) => setDocName(d.original_name))
      .catch((err) => setError(err))
      .finally(() => setLoadingDoc(false));
  }, [docId]);

  function toggleElement(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function generate() {
    if (!docId) return;
    setError(null);
    setSubmitting(true);
    setResult(null);
    try {
      const copy = await api.protect(docId, { level, method, elements: selected });
      setResult(copy);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingDoc) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!docId) {
    return (
      <ErrorState
        error={new Error("No document selected. Open this page from your document history.")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Generate Protected Copy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {docName ? (
            <>
              Creating a shareable copy of <span className="font-medium text-foreground">{docName}</span>
            </>
          ) : (
            "Creating a shareable copy of your document"
          )}{" "}
          — your original is never modified.
        </p>
      </div>

      {error ? <ErrorState error={error} onRetry={() => setError(null)} title="Protection failed" /> : null}

      {!result ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Protection Settings</CardTitle>
              <CardDescription>
                Choose how sensitive elements are protected in the shareable copy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Protection Level</Label>
                <RadioGroup value={level} onValueChange={(v) => setLevel(v as "standard" | "high")}>
                  {levels.map((l) => (
                    <div key={l.value} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                      <RadioGroupItem value={l.value} id={`level-${l.value}`} />
                      <Label htmlFor={`level-${l.value}`} className="font-normal">
                        <span className="block font-semibold text-foreground">{l.title}</span>
                        <span className="text-xs text-muted-foreground">{l.desc}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Protection Method</Label>
                <RadioGroup
                  value={method}
                  onValueChange={(v) => setMethod(v as ProtectionMethod)}
                >
                  {methods.map((m) => (
                    <div key={m.value} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                      <RadioGroupItem value={m.value} id={`method-${m.value}`} />
                      <Label htmlFor={`method-${m.value}`} className="font-normal">
                        <span className="block font-semibold text-foreground">{m.title}</span>
                        <span className="text-xs text-muted-foreground">{m.desc}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Sensitive elements to protect</Label>
                <div className="grid gap-2">
                  {elements.map((el) => (
                    <label
                      key={el.value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm"
                    >
                      <Checkbox
                        checked={selected.includes(el.value)}
                        onCheckedChange={() => toggleElement(el.value)}
                      />
                      <span className="font-medium text-foreground">{el.label}</span>
                    </label>
                  ))}
                </div>
                {selected.length === 0 && (
                  <p className="text-xs text-warning">
                    No elements selected — the copy will be produced without any protection.
                  </p>
                )}
              </div>

              <Button variant="saffron" className="w-full" onClick={generate} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldPlus className="h-4 w-4" />}
                {submitting ? "Generating…" : "Generate Protected Copy"}
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground">How it works</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• Sensitive regions are detected automatically on your page.</li>
                  <li>• A new protected copy is generated as a separate file.</li>
                  <li>• Your original document is never overwritten.</li>
                  <li>• Protected regions are clearly visible in the copy.</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="flex items-start gap-3 p-4">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <p className="text-sm text-muted-foreground">
                  Shareable copies are intended to keep sensitive authentication elements out of
                  circulation. They are not a substitute for official document control procedures.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Protected Copy Ready</Badge>
              <Badge variant="outline">{result.protection_level === "high" ? "High" : "Standard"} level</Badge>
              <Badge variant="outline">
                {result.method === "redact"
                  ? "Permanent Redaction"
                  : result.method === "blur"
                    ? "Blur"
                    : result.method === "pixelate"
                      ? "Pixelation"
                      : "Mask"}
              </Badge>
            </div>
            <Button asChild variant="saffron">
              <a href={protectedCopyUrl(docId)} download>
                <Download className="h-4 w-4" /> Download Protected Copy
              </a>
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-success" /> Secure Original
                </CardTitle>
                <CardDescription className="text-xs">
                  Your original file is never modified.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border bg-muted/40">
                  <img src={signedUrl(docId, 1)} alt="Secure original document" className="block w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-success" /> Safe to Share
                </CardTitle>
                <CardDescription className="text-xs">
                  Sensitive regions are protected in this copy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border bg-muted/40">
                  <img
                    src={protectedCopyUrl(docId)}
                    alt="Protected copy of the document"
                    className="block w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-muted-foreground">
            The original document and its processing data remain untouched. The protected copy is a
            separate shareable file with the selected sensitive regions visibly protected.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setResult(null)}>
              Adjust Settings
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/documents/${docId}`}>View Analysis</Link>
            </Button>
          </div>
        </div>
      )}

      <AIDisclaimer className="mt-2" />
    </div>
  );
}

export default function ProtectPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[60vh] w-full" />}>
      <ProtectContent />
    </Suspense>
  );
}
