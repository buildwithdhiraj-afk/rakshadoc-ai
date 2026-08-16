"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Accessibility,
  ChevronLeft,
  ChevronRight,
  FileText,
  Fingerprint,
  Loader2,
  Maximize,
  MoveHorizontal,
  RotateCw,
  ShieldCheck,
  ShieldPlus,
  Sparkles,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { AIDisclaimer } from "@/components/ai-disclaimer";
import { RiskBadge } from "@/components/dashboard/status-badges";
import { DETECTION_COLORS } from "@/components/dashboard/detection-colors";
import { api, ApiClientError, signedUrl } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { AuditEvent, Detection, Document, OCRResult, DetectionCategory } from "@/types";

function SensitivityBadge({ level }: { level: Detection["sensitivity"] }) {
  switch (level) {
    case "HIGH":
      return <Badge variant="destructive">HIGH</Badge>;
    case "MEDIUM":
      return <Badge variant="warning">MEDIUM</Badge>;
    case "LOW":
      return <Badge variant="success">LOW</Badge>;
    default:
      return <Badge variant="outline">NONE</Badge>;
  }
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<Document | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [ocr, setOcr] = useState<OCRResult[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imgWidth, setImgWidth] = useState<number | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [fitMode, setFitMode] = useState<"width" | "page">("width");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<unknown>(null);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [d, dets, ocrData, auditData, health] = await Promise.all([
        api.getDocument(id),
        api.getDetections(id).catch(() => [] as Detection[]),
        api.getOcr(id).catch(() => [] as OCRResult[]),
        api.getAudit(id).catch(() => [] as AuditEvent[]),
        api.health().catch(() => null),
      ]);
      setDoc(d);
      setDetections(dets);
      setOcr(ocrData);
      setAudit(auditData);
      setDemoMode(health?.demo_mode ?? false);
      setPage(1);
      setSelectedId(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    Promise.all([
      api.getDocument(id),
      api.getDetections(id).catch(() => [] as Detection[]),
      api.getOcr(id).catch(() => [] as OCRResult[]),
      api.getAudit(id).catch(() => [] as AuditEvent[]),
      api.health().catch(() => null),
    ])
      .then(([d, dets, ocrData, auditData, health]) => {
        if (ignore) return;
        setDoc(d);
        setDetections(dets);
        setOcr(ocrData);
        setAudit(auditData);
        setDemoMode(health?.demo_mode ?? false);
        setPage(1);
        setSelectedId(null);
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
  }, [id]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const measure = () => {
      if (natural && fitMode === "width") {
        setImgWidth(Math.max(320, el.clientWidth - 40));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [natural, fitMode]);

  const isDemo = doc?.demo === true || demoMode;

  const pageDetections = useMemo(
    () => detections.filter((d) => d.page === page),
    [detections, page],
  );

  const selected = useMemo(
    () => detections.find((d) => d.id === selectedId) ?? null,
    [detections, selectedId],
  );

  const currentOcr = useMemo(() => ocr.find((o) => o.page === page) ?? null, [ocr, page]);

  const pageCount = Math.max(1, doc?.page_count ?? 1);
  const safePage = Math.min(page, pageCount);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (natural && natural.w === img.naturalWidth) return;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    const el = viewerRef.current;
    if (el) setImgWidth(Math.max(320, el.clientWidth - 40));
  }

  function fitPage() {
    if (!natural || !viewerRef.current) return;
    const available = viewerRef.current.clientHeight - 40;
    setImgWidth(Math.max(240, Math.round((natural.w * available) / natural.h)));
    setFitMode("page");
    setZoom(1);
  }

  function fitWidth() {
    const el = viewerRef.current;
    if (el) setImgWidth(Math.max(320, el.clientWidth - 40));
    setFitMode("width");
    setZoom(1);
  }

  function zoomIn() {
    setZoom((z) => Math.min(4, +(z * 1.25).toFixed(2)));
  }

  function zoomOut() {
    setZoom((z) => Math.max(0.25, +(z * 0.8).toFixed(2)));
  }

  function rotate() {
    setRotation((r) => (r + 90) % 360);
  }

  function focusDetection(d: Detection) {
    setPage(d.page);
    setSelectedId(d.id);
    viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function runAnalysis() {
    if (!id) return;
    setRunningAnalysis(true);
    setError(null);
    try {
      await api.process(id);
      router.push(`/dashboard/documents/${id}/processing`);
    } catch (err) {
      setError(err);
      setRunningAnalysis(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteDocument(id);
      router.push("/dashboard/documents");
    } catch (err) {
      setDeleteError(err);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  if (error && !doc) {
    return <ErrorState error={error} onRetry={load} title="Could not load document" />;
  }

  if (!doc) return null;

  if (doc.status === "processing") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{doc.original_name}</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-foreground">This document is still processing.</p>
            <p className="text-sm text-muted-foreground">
              The analysis pipeline is running and you will see results when it completes.
            </p>
            <Button asChild variant="saffron">
              <Link href={`/dashboard/documents/${id}/processing`}>View Processing Progress</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (doc.status === "failed") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{doc.original_name}</h1>
        <ErrorState
          error={new Error("This document failed during processing and has no analysis results.")}
          title="Processing failed"
        />
        <Button onClick={runAnalysis} disabled={runningAnalysis}>
          {runningAnalysis ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Try Again
        </Button>
      </div>
    );
  }

  if (doc.status === "uploaded") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{doc.original_name}</h1>
        <EmptyState
          icon={FileText}
          title="Not analyzed yet"
          description="Run the RakshaDoc AI pipeline on this document to see layout detection, OCR, sensitive element detection and more."
          action="Run Analysis"
          onAction={runAnalysis}
        />
        {runningAnalysis && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Starting analysis…
          </p>
        )}
        {error ? <ErrorState error={error} onRetry={() => setError(null)} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
              {doc.original_name}
            </h1>
            {isDemo && (
              <Badge variant="demo">
                <Sparkles className="h-3 w-3" /> Demo Analysis
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {doc.mime_type} · {formatDate(doc.created_at)} · {doc.page_count} page
            {doc.page_count !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/documents/${id}/protect`}>
              <ShieldPlus className="h-4 w-4" /> Generate Protected Copy
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/verify?doc=${id}`}>
              <ShieldCheck className="h-4 w-4" /> Verify Integrity
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/braille?doc=${id}`}>
              <Accessibility className="h-4 w-4" /> Braille
            </Link>
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)} aria-label="Delete document">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Document Quality</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {doc.quality_score != null ? `${doc.quality_score.toFixed(0)}%` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Layout</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {doc.analysis?.layout ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">OCR</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{doc.analysis?.ocr ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sensitive Elements</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {doc.analysis?.sensitive_elements ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Integrity</p>
            <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-foreground">
              {doc.analysis?.integrity ? (
                <>
                  <Fingerprint className="h-4 w-4 text-success" />
                  {doc.analysis.integrity}
                </>
              ) : (
                "—"
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tamper Risk</p>
            <div className="mt-1.5">
              <RiskBadge risk={doc.tamper_risk} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[180px_1fr_320px]">
        <div className="hidden flex-col gap-2 xl:flex" aria-label="Page thumbnails">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pages</p>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPage(p);
                setSelectedId(null);
              }}
              className={cn(
                "overflow-hidden rounded-lg border bg-card text-left transition-colors",
                p === safePage ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
              )}
              aria-label={`Page ${p}`}
            >
              <img
                src={signedUrl(id, p)}
                alt={`Page ${p} thumbnail`}
                className="block w-full object-cover"
              />
              <span className="block px-2 py-1 text-center text-xs font-medium text-muted-foreground">
                Page {p}
              </span>
            </button>
          ))}
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={zoomOut} aria-label="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="icon-sm" onClick={zoomIn} aria-label="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="mx-1 h-6" />
              <Button variant="ghost" size="icon-sm" onClick={fitWidth} aria-label="Fit width">
                <MoveHorizontal className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={fitPage} aria-label="Fit page">
                <Maximize className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={rotate} aria-label="Rotate">
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs tabular-nums text-muted-foreground">
                {safePage} / {pageCount}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage >= pageCount}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            ref={viewerRef}
            className="relative overflow-auto rounded-xl border bg-muted/40"
            style={{ height: "min(72vh, 640px)" }}
          >
            <div className="flex min-h-full w-full items-center justify-center p-5">
              <div
                className="relative inline-block"
                style={{
                  width: imgWidth ?? undefined,
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center",
                  transition: "transform 150ms ease",
                }}
              >
                {imgWidth ? (
                  <img
                    src={signedUrl(id, safePage)}
                    alt={`Document page ${safePage}`}
                    onLoad={onImageLoad}
                    draggable={false}
                    className="block max-w-none select-none shadow-sm"
                  />
                ) : (
                  <Skeleton className="h-[60vh] w-[42vw]" />
                )}
                {imgWidth &&
                  pageDetections.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedId((cur) => (cur === d.id ? null : d.id))}
                      className="absolute rounded-sm border-2 transition-opacity hover:opacity-70"
                      style={{
                        left: `${d.bbox.x * 100}%`,
                        top: `${d.bbox.y * 100}%`,
                        width: `${d.bbox.w * 100}%`,
                        height: `${d.bbox.h * 100}%`,
                        borderColor: DETECTION_COLORS[d.category].color,
                        backgroundColor:
                          selectedId === d.id
                            ? `${DETECTION_COLORS[d.category].color}26`
                            : "transparent",
                        boxShadow: selectedId === d.id ? "0 0 0 3px rgba(13,43,82,0.15)" : "none",
                      }}
                      aria-label={`${DETECTION_COLORS[d.category].label} detection`}
                    />
                  ))}
              </div>
            </div>
          </div>

          {pageDetections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 rounded-lg border bg-card p-2">
              {Array.from(
                new Set(pageDetections.map((d) => d.category)),
              ).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: DETECTION_COLORS[cat as DetectionCategory].color }}
                  />
                  {DETECTION_COLORS[cat as DetectionCategory].label}
                </span>
              ))}
            </div>
          )}

          {selected && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {DETECTION_COLORS[selected.category].label}
                  </p>
                  <Badge variant="outline">Page {selected.page}</Badge>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                      {(selected.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sensitivity</p>
                    <div className="mt-1">
                      <SensitivityBadge level={selected.sensitivity} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Action</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {selected.action === "PROTECTED" ? "Protected" : "None"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          <Tabs defaultValue="elements">
            <TabsList className="w-full">
              <TabsTrigger value="elements" className="flex-1">
                Detected Elements
              </TabsTrigger>
              <TabsTrigger value="ocr" className="flex-1">
                OCR
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex-1">
                Audit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="elements">
              <Card>
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm">Detected Elements</CardTitle>
                  <CardDescription className="text-xs">
                    Click an element to focus it on the page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {detections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No layout elements were detected for this document.
                    </p>
                  ) : (
                    <ul className="max-h-[26rem] space-y-2 overflow-auto pr-1">
                      {detections.map((d) => (
                        <li key={d.id}>
                          <button
                            onClick={() => focusDetection(d)}
                            className={cn(
                              "w-full rounded-lg border p-3 text-left transition-colors hover:border-primary/50",
                              selectedId === d.id
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card",
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: DETECTION_COLORS[d.category].color }}
                                />
                                {DETECTION_COLORS[d.category].label}
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Page {d.page}
                                </span>
                                <SensitivityBadge level={d.sensitivity} />
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <Progress
                                value={Math.round(d.confidence * 100)}
                                className="h-1.5 flex-1"
                              />
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {(d.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ocr">
              <Card>
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm">Extracted Text</CardTitle>
                  <CardDescription className="text-xs">
                    {currentOcr
                      ? `${currentOcr.language} · language confidence ${(currentOcr.language_confidence * 100).toFixed(0)}%`
                      : "No OCR data available."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {currentOcr ? (
                    <>
                      <div className="flex items-center gap-2">
                        {currentOcr.source === "demo" && (
                          <Badge variant="demo">
                            <Sparkles className="h-3 w-3" /> Demo
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">Page {currentOcr.page}</span>
                      </div>
                      <pre className="mt-3 max-h-[22rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
                        {currentOcr.text}
                      </pre>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No OCR result was produced for this page.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit">
              <Card>
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-sm">Audit Trail</CardTitle>
                  <CardDescription className="text-xs">
                    Important events recorded for this document.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {audit.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No audit events recorded yet.</p>
                  ) : (
                    <ul className="max-h-[26rem] space-y-2 overflow-auto pr-1">
                      {audit.map((e) => (
                        <li key={e.id} className="rounded-lg border border-border bg-card p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{e.action}</p>
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatDate(e.created_at)}
                            </span>
                          </div>
                          {e.detail && (
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {e.detail}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {isDemo && (
        <p className="flex items-start gap-2 rounded-lg border border-dashed border-warning/40 bg-warning/5 p-3 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          Analysis for this document was produced by the demo pipeline. It is simulated and
          clearly not a real trained-model result.
        </p>
      )}

      <AIDisclaimer />

      <Dialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              Deleting this document will remove its stored processing data according to the
              configured retention policy. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {deleteError instanceof ApiClientError
                ? deleteError.message
                : deleteError instanceof Error
                  ? deleteError.message
                  : "Could not delete the document."}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
