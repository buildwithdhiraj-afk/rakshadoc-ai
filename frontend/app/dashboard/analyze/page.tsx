"use client";

import { useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, UploadCloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/error-state";
import { ProcessingView } from "@/components/dashboard/processing-view";
import { api } from "@/lib/api";
import { cn, formatBytes } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/tiff",
  "image/webp",
  "image/bmp",
];
const MAX_SIZE_MB = 25;

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(f: File): string | null {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return `Unsupported file type "${f.type || "unknown"}". Accepted types: PDF, PNG, JPEG, TIFF, WEBP, BMP.`;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File is larger than the ${MAX_SIZE_MB} MB maximum.`;
    }
    return null;
  }

  async function handleFile(f: File) {
    setError(null);
    const problem = validate(f);
    if (problem) {
      setError(new Error(problem));
      return;
    }
    setFile(f);
    setUploading(true);
    try {
      const doc = await api.upload(f);
      await api.process(doc.id);
      setDocumentId(doc.id);
      setDocumentName(doc.original_name);
    } catch (err) {
      setError(err);
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analyze a Document</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a scanned or digital document to run layout analysis, OCR, sensitive-element
          detection, integrity verification and Braille output.
        </p>
      </div>

      {error ? <ErrorState error={error} title="Upload failed" onRetry={() => setError(null)} /> : null}

      {documentId ? (
        <ProcessingView documentId={documentId} fileName={documentName} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Document</CardTitle>
            <CardDescription>
              Your original file is never overwritten. Analysis runs on a protected copy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload a document"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors",
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <UploadCloud className="h-8 w-8 text-primary" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {uploading
                    ? "Uploading…"
                    : "Drag & drop your document here, or click to browse"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF · PNG · JPEG · TIFF · WEBP · BMP — up to {MAX_SIZE_MB} MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                Choose File
              </Button>
            </div>

            {file && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="rounded-lg bg-card p-2 text-muted-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                {file.type === "application/pdf" ? (
                  <Badge variant="outline">PDF</Badge>
                ) : (
                  <Badge variant="outline">Image</Badge>
                )}
              </div>
            )}

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p>
                In Demo Mode, analysis results are simulated until trained models are connected.
                Results are for demonstration only and are clearly labelled as Demo Analysis.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
