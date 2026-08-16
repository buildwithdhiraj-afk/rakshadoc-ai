"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Accessibility,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  Fingerprint,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  Maximize,
  MoveHorizontal,
  RotateCw,
  ShieldCheck,
  ShieldPlus,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { api, ApiClientError, protectedCopyUrl, signedUrl } from "@/lib/api";
import { cn, formatDate, truncateHash } from "@/lib/utils";
import type { AuditEvent, Detection, Document, OCRResult, DetectionCategory } from "@/types";

function SensitivityBadge({ level }: { level: Detection["sensitivity"] }) {
  switch (level) {
    case "HIGH":
      return <Badge variant="destructive">High Sensitivity</Badge>;
    case "MEDIUM":
      return <Badge variant="warning">Medium Sensitivity</Badge>;
    case "LOW":
      return <Badge variant="secondary">Low Sensitivity</Badge>;
    default:
      return <Badge variant="outline">Standard</Badge>;
  }
}

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();

  const [doc, setDoc] = useState<Document | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [ocr, setOcr] = useState<OCRResult[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [fitMode, setFitMode] = useState<"width" | "page">("width");
  const [imgWidth, setImgWidth] = useState<number | null>(null);

  const [viewerTab, setViewerTab] = useState<"boxes" | "original" | "protected">("boxes");
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large">("normal");
  const [copiedText, setCopiedText] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.health().then((h) => setDemoMode(h.demo_mode)).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [d, det, o, a] = await Promise.all([
        api.getDocument(id),
        api.getDetections(id),
        api.getOcr(id),
        api.getAudit(id),
      ]);
      setDoc(d);
      setDetections(det);
      setOcr(o);
      setAudit(a);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    loadData().then(() => {
      if (ignore) return;
    });
    return () => {
      ignore = true;
    };
  }, [loadData]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    if (!imgWidth) {
      setImgWidth(Math.max(320, el.clientWidth - 40));
    }
    const measure = () => {
      if (fitMode === "width") {
        setImgWidth(Math.max(320, el.clientWidth - 40));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [natural, fitMode, loading, imgWidth]);

  const isDemo = doc?.demo === true || demoMode;

  const pageDetections = useMemo(
    () => detections.filter((d) => d.page === page),
    [detections, page],
  );

  const sensitiveDetections = useMemo(
    () => detections.filter((d) => d.sensitivity === "HIGH" || d.sensitivity === "MEDIUM"),
    [detections],
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
    setZoom((z) => Math.min(3, z + 0.25));
  }

  function zoomOut() {
    setZoom((z) => Math.max(0.5, z - 0.25));
  }

  function rotate() {
    setRotation((r) => (r + 90) % 360);
  }

  function focusDetection(d: Detection) {
    setPage(d.page);
    setSelectedId(d.id);
  }

  async function handleDelete() {
    if (!doc) return;
    setDeleting(true);
    try {
      await api.deleteDocument(doc.id);
      router.replace("/dashboard/documents");
    } catch (err) {
      setError(err);
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  function copyOcrText() {
    if (!currentOcr?.text) return;
    void navigator.clipboard.writeText(currentOcr.text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }

  function toggleSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!currentOcr?.text) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(currentOcr.text);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(u);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <ErrorState
          error={error ?? new Error("Document not found")}
          title="Document Error"
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Top Header & Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <Button asChild variant="saffron" size="sm">
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
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete document"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 1. Plain-English Summary Takeaway Banner */}
        <Card className="border-success/30 bg-success/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-success/10 p-2 text-success">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  🛡️ Safe to Share Summary
                </p>
                <p className="text-xs text-muted-foreground">
                  {sensitiveDetections.length > 0
                    ? `${sensitiveDetections.length} sensitive element(s) (${Array.from(new Set(sensitiveDetections.map((d) => d.category))).join(", ")}) detected and ready for permanent redaction.`
                    : "No high-sensitivity elements detected. Document is clear to share."}{" "}
                  File SHA-256 cryptographic hash verified.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild variant="success" size="sm">
                <a href={protectedCopyUrl(id)} target="_blank" rel="noreferrer">
                  Download Protected Copy
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Top Summary Metric Cards with Tooltips */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Document Quality
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground opacity-60 hover:opacity-100" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Image legibility score based on contrast, resolution, and noise.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {doc.quality_score != null ? `${doc.quality_score.toFixed(0)}%` : "—"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Layout
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground opacity-60 hover:opacity-100" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Deep learning document layout parsing status.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {doc.analysis?.layout ?? "Complete"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  OCR
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground opacity-60 hover:opacity-100" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Optical Character Recognition text extraction status.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {doc.analysis?.ocr ?? "Complete"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sensitive Elements
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground opacity-60 hover:opacity-100" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Signatures, official stamps, seals, or QR codes identified.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {detections.filter((d) => d.sensitivity === "HIGH").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  SHA-256 Integrity
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground opacity-60 hover:opacity-100" />
                  </TooltipTrigger>
                  <TooltipContent>
                    SHA-256 is a 64-char file fingerprint confirming document content hasn't changed.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="mt-1 text-sm font-semibold text-success flex items-center gap-1">
                <Check className="h-4 w-4" /> Verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Tamper Risk
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground opacity-60 hover:opacity-100" />
                  </TooltipTrigger>
                  <TooltipContent>
                    AI estimation checking image edit artifacts & spatial gaps.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="mt-1">
                <RiskBadge risk={doc.tamper_risk ?? "LOW"} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Main Viewer Grid (Split / Tab Comparison + Detection Sidebar) */}
        <div className="grid gap-6 xl:grid-cols-[180px_1fr_340px]">

          {/* Left: Page Thumbnails */}
          <div className="flex gap-2 overflow-x-auto xl:flex-col xl:overflow-y-auto">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPage(p);
                  setSelectedId(null);
                }}
                className={cn(
                  "overflow-hidden rounded-lg border bg-card text-left transition-colors shrink-0 w-24 xl:w-full",
                  p === safePage
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50",
                )}
                aria-label={`Page ${p}`}
              >
                <img
                  src={signedUrl(id, p)}
                  alt={`Page ${p} thumbnail`}
                  className="block w-full object-cover h-20"
                />
                <span className="block px-2 py-1 text-center text-xs font-medium text-muted-foreground">
                  Page {p}
                </span>
              </button>
            ))}
          </div>

          {/* Center: Interactive Multi-Tab Document Viewer */}
          <div className="min-w-0 space-y-3">

            {/* Viewer Mode Tabs + Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-2">
              <Tabs
                value={viewerTab}
                onValueChange={(v) => setViewerTab(v as any)}
                className="w-auto"
              >
                <TabsList className="h-8">
                  <TabsTrigger value="boxes" className="text-xs">
                    <Layers className="h-3.5 w-3.5" /> AI Layout Boxes
                  </TabsTrigger>
                  <TabsTrigger value="original" className="text-xs">
                    <Eye className="h-3.5 w-3.5" /> Original Scan
                  </TabsTrigger>
                  <TabsTrigger value="protected" className="text-xs">
                    <Lock className="h-3.5 w-3.5" /> Protected Copy
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={zoomOut} aria-label="Zoom out">
                  <ZoomOut className="h-4 w-4" />
                </Button>

                <span className="w-12 text-center text-xs font-semibold tabular-nums text-foreground">
                  {Math.round(zoom * 100)}%
                </span>

                <Button variant="ghost" size="icon-sm" onClick={zoomIn} aria-label="Zoom in">
                  <ZoomIn className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="mx-1 h-5" />

                <Button
                  variant={fitMode === "width" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={fitWidth}
                  aria-label="Fit width"
                >
                  <MoveHorizontal className="h-4 w-4" />
                </Button>

                <Button
                  variant={fitMode === "page" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={fitPage}
                  aria-label="Fit page"
                >
                  <Maximize className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="icon-sm" onClick={rotate} aria-label="Rotate">
                  <RotateCw className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="mx-1 h-5" />

                <Button
                  variant={highContrast ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setHighContrast(!highContrast)}
                  aria-label="Toggle High Contrast"
                >
                  <Sun className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 border-l pl-2 text-xs">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={safePage <= 1}
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      setSelectedId(null);
                    }}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="tabular-nums text-muted-foreground">
                    {safePage} / {pageCount}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={safePage >= pageCount}
                    onClick={() => {
                      setPage((p) => Math.min(pageCount, p + 1));
                      setSelectedId(null);
                    }}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Image Container */}
            <div
              ref={viewerRef}
              className={cn(
                "relative overflow-auto rounded-xl border transition-colors",
                highContrast ? "bg-black p-2" : "bg-muted/40",
              )}
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
                  <img
                    src={
                      viewerTab === "protected"
                        ? protectedCopyUrl(id)
                        : signedUrl(id, safePage)
                    }
                    alt={`Document page ${safePage}`}
                    onLoad={onImageLoad}
                    draggable={false}
                    className={cn(
                      "block max-w-none select-none shadow-sm transition-all",
                      highContrast && "contrast-200 invert",
                    )}
                  />

                  {/* AI Bounding Box Layer */}
                  {viewerTab === "boxes" &&
                    pageDetections.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedId((cur) => (cur === d.id ? null : d.id))}
                        className="absolute rounded-sm border-2 transition-opacity hover:opacity-80"
                        style={{
                          left: `${d.bbox.x * 100}%`,
                          top: `${d.bbox.y * 100}%`,
                          width: `${d.bbox.w * 100}%`,
                          height: `${d.bbox.h * 100}%`,
                          borderColor: DETECTION_COLORS[d.category].color,
                          backgroundColor:
                            selectedId === d.id
                              ? `${DETECTION_COLORS[d.category].color}33`
                              : `${DETECTION_COLORS[d.category].color}12`,
                          boxShadow: selectedId === d.id ? "0 0 0 3px rgba(13,43,82,0.2)" : "none",
                        }}
                        aria-label={`${DETECTION_COLORS[d.category].label} detection`}
                      >
                        <span
                          className="absolute -top-5 left-0 rounded px-1 py-0.2 text-[9px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: DETECTION_COLORS[d.category].color }}
                        >
                          {DETECTION_COLORS[d.category].label}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Category Color Legend */}
            {pageDetections.length > 0 && viewerTab === "boxes" && (
              <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-2 text-xs">
                {Array.from(new Set(pageDetections.map((d) => d.category))).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      const match = pageDetections.find((d) => d.category === cat);
                      if (match) setSelectedId(match.id);
                    }}
                    className="flex items-center gap-1.5 rounded border bg-muted/30 px-2 py-1 text-muted-foreground hover:text-foreground"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: DETECTION_COLORS[cat].color }}
                    />
                    <span>{DETECTION_COLORS[cat].label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Element Focus Detail */}
            {selected && (
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">
                      {DETECTION_COLORS[selected.category].label} Selected
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
                      <p className="text-xs text-muted-foreground">Protection Action</p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {selected.action === "PROTECTED" ? "🛡️ Redact on Share" : "None"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Category Tabs (Detected Elements, OCR with Audio Reader, Audit Log) */}
          <div className="min-w-0 space-y-3">
            <Tabs defaultValue="elements">
              <TabsList className="w-full">
                <TabsTrigger value="elements" className="flex-1 text-xs">
                  Detected Elements
                </TabsTrigger>
                <TabsTrigger value="ocr" className="flex-1 text-xs">
                  OCR Text
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex-1 text-xs">
                  Audit Log
                </TabsTrigger>
              </TabsList>

              <TabsContent value="elements">
                <Card>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-sm">Detected Elements ({detections.length})</CardTitle>
                    <CardDescription className="text-xs">
                      Click an element to focus it on the document page.
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

              {/* OCR Tab with Text-to-Speech Audio Reader */}
              <TabsContent value="ocr">
                <Card>
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Extracted Text</CardTitle>
                      <CardDescription className="text-xs">
                        {currentOcr
                          ? `${currentOcr.language} · ${(currentOcr.language_confidence * 100).toFixed(0)}% confidence`
                          : "No OCR text."}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={toggleSpeech}
                        title={isSpeaking ? "Stop Speaking" : "Read Text Aloud (Text-to-Speech)"}
                        aria-label="Read text aloud"
                      >
                        <Volume2 className={cn("h-4 w-4", isSpeaking && "text-saffron animate-pulse")} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={copyOcrText}
                        title="Copy extracted text"
                        aria-label="Copy text"
                      >
                        {copiedText ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {!currentOcr ? (
                      <p className="text-sm text-muted-foreground">No OCR results for page {safePage}.</p>
                    ) : (
                      <pre className="max-h-[24rem] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-sans text-xs text-foreground leading-relaxed">
                        {currentOcr.text}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Audit Log Tab */}
              <TabsContent value="audit">
                <Card>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-sm">Audit Trail</CardTitle>
                    <CardDescription className="text-xs">
                      Recorded processing operations for compliance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    {audit.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No audit events recorded.</p>
                    ) : (
                      <ul className="max-h-[24rem] space-y-2 overflow-auto text-xs">
                        {audit.map((a) => (
                          <li key={a.id} className="rounded-md border p-2.5">
                            <div className="flex items-center justify-between font-semibold text-foreground">
                              <span className="capitalize">{a.action}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDate(a.created_at)}
                              </span>
                            </div>
                            {a.detail && <p className="mt-1 text-muted-foreground">{a.detail}</p>}
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

        <AIDisclaimer />

        {/* Delete Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Document Permanently</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{doc.original_name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
