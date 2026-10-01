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
  FileWarning,
  Fingerprint,
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
import { TooltipProvider } from "@/components/ui/tooltip";
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
import { AIDisclaimer } from "@/components/ai-disclaimer";
import { DETECTION_COLORS } from "@/components/dashboard/detection-colors";
import { api, protectedCopyUrl, protectedPreviewUrl, signedUrl } from "@/lib/api";
import { calculateDocumentFrame, getPageDetections } from "@/lib/document-geometry";
import { cn, formatDate } from "@/lib/utils";
import type { AuditEvent, Detection, Document, DocumentInsights, OCRResult } from "@/types";

/** Detection categories that carry personal or otherwise sensitive content. */
const SENSITIVE_CATEGORIES = new Set<Detection["category"]>([
  "signature",
  "stamp",
  "seal",
  "qr_code",
  "person",
  "date",
  "address",
  "identity_number",
  "financial_info",
]);

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

/** Real page preview. Surfaces a load failure instead of a blank/broken tile. */
function PageThumbnail({
  docId,
  page,
  active,
  onSelect,
}: {
  docId: string;
  page: number;
  active: boolean;
  onSelect: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset during render (React's documented "adjust state on prop change" pattern)
  // instead of in an effect, which would cause a cascading second render.
  const [prevThumbKey, setPrevThumbKey] = useState(`${docId}:${page}`);
  const thumbKey = `${docId}:${page}`;
  if (prevThumbKey !== thumbKey) {
    setPrevThumbKey(thumbKey);
    setFailed(false);
    setLoaded(false);
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Go to page ${page}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 w-24 overflow-hidden rounded-lg border bg-card text-left transition-colors xl:w-full",
        active
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50",
      )}
    >
      <span className="flex h-20 w-full items-center justify-center overflow-hidden bg-muted/40">
        {failed ? (
          <span className="px-2 text-center text-[10px] leading-tight text-muted-foreground">
            Preview unavailable
          </span>
        ) : (
          <img
            src={signedUrl(docId, page)}
            alt={`Page ${page} thumbnail`}
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "block h-full w-full object-contain transition-opacity duration-150",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </span>
      <span className="block px-2 py-1 text-center text-xs font-medium text-muted-foreground">
        Page {page}
      </span>
    </button>
  );
}

/** Shown in place of the page when the real image request fails. */
function PageLoadError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-center"
    >
      <FileWarning className="h-8 w-8 text-destructive" />
      <p className="text-sm font-semibold text-foreground">Unable to load document page.</p>
      <p className="max-w-sm text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();

  const [doc, setDoc] = useState<Document | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [ocr, setOcr] = useState<OCRResult[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [insights, setInsights] = useState<DocumentInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [fitMode, setFitMode] = useState<"width" | "page">("width");
  const [available, setAvailable] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [imageError, setImageError] = useState<string | null>(null);

  const [viewerTab, setViewerTab] = useState<"boxes" | "original" | "protected">("boxes");
  const [highContrast, setHighContrast] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const viewerRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [d, det, o, a, ins] = await Promise.all([
        api.getDocument(id),
        api.getDetections(id),
        api.getOcr(id),
        api.getAudit(id),
        api.getInsights(id).catch(() => null),
      ]);
      setDoc(d);
      setDetections(det);
      setOcr(o);
      setAudit(a);
      setInsights(ins);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Initial data fetch; loading state intentionally starts as true.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const measure = () => {
      const style = window.getComputedStyle(el);
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      setAvailable({
        width: Math.max(0, el.clientWidth - paddingX),
        height: Math.max(0, el.clientHeight - paddingY),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  // Only a generated sample is a demo; the server's global demo_mode flag just
  // says the sample generator is available, not that this analysis is fake.
  const isDemo = doc?.demo === true;

  const pageCount = Math.max(1, doc?.page_count ?? 1);
  const safePage = Math.min(page, pageCount);

  const pageDetections = useMemo(
    () => getPageDetections(detections, safePage),
    [detections, safePage],
  );

  // Labels of boxes sharing a horizontal band alternate above/below so
  // same-row detections (signature/stamp/QR) never overlap their labels.
  const labelSides = useMemo(() => {
    const sides: Record<string, "top" | "bottom"> = {};
    const sorted = [...pageDetections].sort(
      (a, b) => a.bbox.y - b.bbox.y || a.bbox.x - b.bbox.x,
    );
    const bands: { y: number; ids: string[] }[] = [];
    for (const d of sorted) {
      const band = bands.find((b) => Math.abs(b.y - d.bbox.y) < 0.03);
      if (band) band.ids.push(d.id);
      else bands.push({ y: d.bbox.y, ids: [d.id] });
    }
    for (const band of bands) {
      band.ids.forEach((dId, i) => {
        sides[dId] = i % 2 === 0 ? "top" : "bottom";
      });
    }
    for (const d of sorted) {
      if (sides[d.id] === "top" && d.bbox.y < 0.035) sides[d.id] = "bottom";
      else if (sides[d.id] === "bottom" && d.bbox.y + d.bbox.h > 0.965) sides[d.id] = "top";
    }
    return sides;
  }, [pageDetections]);

  // Real per-category detection counts, ordered by how many were found.
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of detections) counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [detections]);

  const sensitiveCount = useMemo(
    () => detections.filter((d) => SENSITIVE_CATEGORIES.has(d.category)).length,
    [detections],
  );

  // Risk is the share of detected regions that are sensitive, capped at 100.
  const privacyRisk = useMemo(() => {
    if (detections.length === 0) return { label: "UNKNOWN (0/100)", score: 0 };
    const score = Math.min(100, Math.round((sensitiveCount / detections.length) * 100));
    const level = score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";
    return { label: `${level} (${score}/100)`, score };
  }, [detections.length, sensitiveCount]);

  const qualityLabel =
    doc?.quality_score != null ? `${doc.quality_score.toFixed(1)}%` : "not scored";

  const docTypeLabel =
    doc?.mime_type === "application/pdf"
      ? `PDF · ${doc.page_count} page${doc.page_count === 1 ? "" : "s"}`
      : (doc?.mime_type ?? "Unknown");

  const ocrConfidenceLabel = useMemo(() => {
    if (ocr.length === 0) return "no text";
    const avg = ocr.reduce((s, o) => s + (o.language_confidence ?? 0), 0) / ocr.length;
    return `${(avg * 100).toFixed(1)}%`;
  }, [ocr]);

  // Observations are only stated when the matching region was actually detected.
  const observations = useMemo(() => {
    const out: string[] = [];
    const count = (cat: string) => detections.filter((d) => d.category === cat).length;
    const sig = count("signature") + count("stamp") + count("seal");
    if (sig > 0) {
      out.push(
        `${sig} signature/stamp/seal region${sig > 1 ? "s" : ""} detected — review these before sharing.`,
      );
    }
    const qr = count("qr_code");
    if (qr > 0) out.push(`${qr} QR code region${qr > 1 ? "s" : ""} detected.`);
    const idn = count("identity_number");
    if (idn > 0) out.push(`${idn} identity number region${idn > 1 ? "s" : ""} detected.`);
    if (detections.length === 0) out.push("No regions were detected in this document.");
    return out;
  }, [detections]);

  // Displayed size of the current page image, pre-zoom and pre-rotation. The
  // page wrapper and the bbox overlay both use exactly this frame, so a
  // normalized bbox lands on the pixel it was measured on.
  const frame = useMemo(
    () => calculateDocumentFrame(natural, available, fitMode),
    [natural, available, fitMode],
  );

  // When rotation swaps width/height, the on-screen footprint swaps with it.
  const isQuarterTurned = rotation === 90 || rotation === 270;
  const outerSize = {
    width: Math.round(frame.width * zoom),
    height: Math.round(frame.height * zoom),
  };
  const pageSizerSize = isQuarterTurned
    ? { width: outerSize.height, height: outerSize.width }
    : outerSize;

  // The transformed layer rotates around its top-left corner, which pushes the
  // painted page into negative x/y on 90/180/270 turns. This translation pulls
  // it back into the positive quadrant so the rotated page lands exactly on top
  // of the swapped pageSizer box. Values are in unzoomed frame units and are
  // therefore scaled uniformly by the leading scale().
  const rotationShift = useMemo(() => {
    switch (rotation) {
      case 90:
        return { x: frame.height, y: 0 };
      case 180:
        return { x: frame.width, y: frame.height };
      case 270:
        return { x: 0, y: frame.width };
      default:
        return { x: 0, y: 0 };
    }
  }, [rotation, frame.width, frame.height]);

  const selected = useMemo(
    () => detections.find((d) => d.id === selectedId) ?? null,
    [detections, selectedId],
  );

  const currentOcr = useMemo(() => ocr.find((o) => o.page === safePage) ?? null, [ocr, safePage]);

  const activeSrc =
    viewerTab === "protected"
      ? protectedPreviewUrl(id, safePage)
      : signedUrl(id, safePage);

  // A new page/tab needs its own load + error state. Reset during render rather
  // than in an effect so a stale error never paints for a frame.
  const [prevActiveSrc, setPrevActiveSrc] = useState(activeSrc);
  if (prevActiveSrc !== activeSrc) {
    setPrevActiveSrc(activeSrc);
    setImageError(null);
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.naturalWidth > 0) {
      setNatural((prev) =>
        prev && prev.w === img.naturalWidth && prev.h === img.naturalHeight
          ? prev
          : { w: img.naturalWidth, h: img.naturalHeight },
      );
    }
    setImageError(null);
  }

  function onImageError() {
    setImageError(
      "Unable to load document page. Check the document source or server, then retry.",
    );
  }

  function fitPage() {
    setFitMode("page");
    setZoom(1);
  }

  function fitWidth() {
    setFitMode("width");
    setZoom(1);
  }

  function zoomIn() {
    setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100));
  }

  function zoomOut() {
    setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
  }

  function rotate() {
    setRotation((r) => (r + 90) % 360);
  }

  function goToPage(next: number) {
    setPage(Math.min(Math.max(1, next), pageCount));
    setSelectedId(null);
  }

  function focusDetection(d: Detection) {
    setPage(Math.min(Math.max(1, d.page), pageCount));
    setSelectedId(d.id);
    // Scroll the highlighted region into view once it has been painted.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-detection-id="${CSS.escape(d.id)}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      });
    });
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
                Document Analysis — {doc.original_name}
              </h1>
              {isDemo ? (
                <Badge variant="demo">
                  <Sparkles className="h-3 w-3" /> DEMO ANALYSIS
                </Badge>
              ) : (
                <Badge variant="success">
                  <Sparkles className="h-3 w-3" /> REAL AI ANALYSIS
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
                <ShieldPlus className="h-4 w-4" /> AI Recommended Protection
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

        {/* Top Status Banner */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  🧠 DOCUMENT ANALYSIS COMPLETE
                </p>
                <p className="text-xs text-muted-foreground">
                  Quality Score:{" "}
                  <span className="font-bold text-primary">{qualityLabel}</span> · Document Type:{" "}
                  <span className="font-semibold text-foreground">{docTypeLabel}</span> · Entities Found:{" "}
                  <span className="font-semibold text-foreground">{insights?.entities.length ?? 0}</span> ·
                  Sensitive Elements:{" "}
                  <span className="font-bold text-rose-600">{sensitiveCount}</span> · Privacy Risk:{" "}
                  <span className="font-bold text-rose-600">{privacyRisk.label}</span>
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

        {/* 7 Core Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Card className="p-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">Quality Score</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-primary">{qualityLabel}</p>
          </Card>
          <Card className="p-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">Doc Type</p>
            <p className="mt-1 text-xs font-bold text-foreground truncate">{docTypeLabel}</p>
          </Card>
          <Card className="p-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">Entities Found</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {insights?.entities.length ?? 0}
            </p>
          </Card>
          <Card className="p-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">Sensitive Elements</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-rose-600">{sensitiveCount}</p>
          </Card>
          <Card className="p-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">Privacy Risk</p>
            <p className="mt-1 text-xs font-bold text-rose-600">{privacyRisk.label}</p>
          </Card>
          <Card className="p-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">Text Confidence</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{ocrConfidenceLabel}</p>
          </Card>
          <Card className="p-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">SHA-256 Hash</p>
            <p
              className={`mt-1 text-xs font-semibold flex items-center gap-1 ${
                doc?.sha256_hash ? "text-emerald-600" : "text-muted-foreground"
              }`}
              title={doc?.sha256_hash ?? undefined}
            >
              {doc?.sha256_hash ? (
                <>
                  <Check className="h-3.5 w-3.5" /> {doc.sha256_hash.slice(0, 12)}…
                </>
              ) : (
                "NOT COMPUTED"
              )}
            </p>
          </Card>
        </div>

        {/* Intelligent Document Understanding Grid Section */}
        <Card className="border-primary/20">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">Document Insights &amp; Entity Extraction</CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {insights ? `Rule-based NER · ${insights.text_source.replace(/_/g, " ")}` : "Loading…"}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-foreground">Detected Document Sections:</p>
              {insights && insights.sections.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  {insights.sections.map((s) => (
                    <div key={s} className="p-2 rounded border bg-muted">✓ {s}</div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground font-mono text-[11px]">No sections detected yet.</p>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-foreground">Extracted Named Entities:</p>
              {insights && insights.entities.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  {insights.entities.map((e, i) => (
                    <div key={`${e.type}-${e.value}-${i}`} className="p-2 rounded border bg-card">
                      <span className="text-muted-foreground">{e.type}:</span> {e.value}
                      {e.page ? <span className="text-muted-foreground"> (p{e.page})</span> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground font-mono text-[11px]">
                  {insights && insights.pages_with_text === 0
                    ? "No extractable text on any page — nothing to extract."
                    : "No entities matched in the extracted text."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Main Viewer Grid (Split / Tab Comparison + Detection Sidebar) */}
        <div className="grid gap-6 xl:grid-cols-[180px_1fr_340px]">

          {/* Left: Page Thumbnails */}
          <div className="flex gap-2 overflow-x-auto xl:flex-col xl:overflow-y-auto">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <PageThumbnail
                key={p}
                docId={id}
                page={p}
                active={p === safePage}
                onSelect={() => goToPage(p)}
              />
            ))}
          </div>

          {/* Center: Interactive Multi-Tab Document Viewer */}
          <div className="min-w-0 space-y-3">

            {/* Viewer Mode Tabs + Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-2">
              <Tabs
                value={viewerTab}
                onValueChange={(v) => setViewerTab(v as "boxes" | "original" | "protected")}
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
                    onClick={() => goToPage(safePage - 1)}
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
                    onClick={() => goToPage(safePage + 1)}
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
                highContrast ? "bg-black" : "bg-muted/40",
              )}
              style={{ height: "min(72vh, 640px)" }}
            >
              <div className="flex min-h-full min-w-full items-center justify-center p-5">
                {/*
                  pageSizer owns the scrollable footprint (post-zoom, post-rotation
                  dimensions) so the scrollbars match what is actually painted;
                  the inner layer carries the transform and holds the page image
                  and the box overlay together, which keeps boxes locked to the
                  document at every zoom level and rotation.
                */}
                <div
                  className="relative shrink-0"
                  style={{ width: pageSizerSize.width, height: pageSizerSize.height }}
                >
                  <div
                    className="absolute top-0 left-0 origin-top-left"
                    style={{
                      width: frame.width,
                      height: frame.height,
                      transform: `scale(${zoom}) translate(${rotationShift.x}px, ${rotationShift.y}px) rotate(${rotation}deg)`,
                      transition: "transform 150ms ease",
                    }}
                  >
                    {/* Document page: explicit frame => real page boundary */}
                    <div
                      className="absolute inset-0 overflow-hidden bg-white shadow-lg ring-1 ring-slate-900/10"
                      style={{ width: frame.width, height: frame.height }}
                    >
                      <img
                        key={activeSrc}
                        src={activeSrc}
                        alt={`Document page ${safePage} of ${pageCount}`}
                        onLoad={onImageLoad}
                        onError={onImageError}
                        draggable={false}
                        className={cn(
                          "block h-full w-full select-none",
                          highContrast && "contrast-200 invert",
                        )}
                        style={{ objectFit: "fill" }}
                      />
                    </div>

                    {/* AI Bounding Box Layer — same coordinate space as the page */}
                    {viewerTab === "boxes" && !imageError && (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{ width: frame.width, height: frame.height }}
                      >
                        {pageDetections.map((d) => {
                          const colorInfo =
                            DETECTION_COLORS[d.category] || { label: d.category, color: "#3b82f6" };
                          const isSelected = selectedId === d.id;
                          return (
                            <button
                              key={d.id}
                              data-detection-id={d.id}
                              type="button"
                              onClick={() =>
                                setSelectedId((cur) => (cur === d.id ? null : d.id))
                              }
                              className={cn(
                                "group pointer-events-auto absolute rounded-sm border-2 transition-shadow",
                                isSelected
                                  ? "z-20 shadow-[0_0_0_3px] shadow-primary/30"
                                  : "z-10 hover:shadow-[0_0_0_2px] hover:shadow-primary/25",
                              )}
                              style={{
                                left: `${d.bbox.x * 100}%`,
                                top: `${d.bbox.y * 100}%`,
                                width: `${d.bbox.w * 100}%`,
                                height: `${d.bbox.h * 100}%`,
                                borderColor: colorInfo.color,
                                backgroundColor: isSelected
                                  ? `${colorInfo.color}33`
                                  : `${colorInfo.color}15`,
                              }}
                              aria-label={`${colorInfo.label} detection on page ${d.page}, ${Math.round(
                                d.confidence * 100,
                              )} percent confidence`}
                            >
                              <span
                                className={cn(
                                  "absolute left-0 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white shadow-sm",
                                  (labelSides[d.id] ?? "top") === "top" ? "-top-6" : "-bottom-6",
                                )}
                                style={{ backgroundColor: colorInfo.color }}
                              >
                                <span>{colorInfo.label}</span>
                                <span>·</span>
                                <span>{Math.round(d.confidence * 100)}%</span>
                                {d.confidence < 0.65 && (
                                  <span className="rounded bg-black/40 px-1 text-[9px]">LOW</span>
                                )}
                                {d.sensitivity === "HIGH" && (
                                  <span className="text-[9px]">🔴 HIGH</span>
                                )}
                                {d.sensitivity === "MEDIUM" && (
                                  <span className="text-[9px]">🟠 MED</span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {imageError && (
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-white p-6"
                        style={{ width: frame.width, height: frame.height }}
                      >
                        <PageLoadError message={imageError} />
                      </div>
                    )}
                  </div>
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

          {/* Right: Category Tabs (Detected Elements, AI Insights, OCR with Audio Reader, Audit Log) */}
          <div className="min-w-0 space-y-3">
            <Tabs defaultValue="elements">
              <TabsList className="w-full grid grid-cols-4 text-xs">
                <TabsTrigger value="elements" className="text-[11px] px-1">
                  Elements
                </TabsTrigger>
                <TabsTrigger value="insights" className="text-[11px] px-1">
                  AI Insights
                </TabsTrigger>
                <TabsTrigger value="ocr" className="text-[11px] px-1">
                  OCR Text
                </TabsTrigger>
                <TabsTrigger value="audit" className="text-[11px] px-1">
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
                                {d.confidence < 0.65 && (
                                  <span className="text-[10px] font-semibold text-amber-600">
                                    LOW CONFIDENCE
                                  </span>
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Insights Tab */}
              <TabsContent value="insights">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" /> 🧠 DOCUMENT INSIGHTS
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Structural observations computed from this document&apos;s own detections.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3 text-xs">
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                      <p className="font-semibold text-foreground">
                        Document Type: {doc?.mime_type === "application/pdf" ? "PDF Document" : doc?.mime_type ?? "Unknown"}
                      </p>
                      <p className="text-muted-foreground">
                        Quality Score:{" "}
                        <span className="text-primary font-bold">
                          {doc?.quality_score != null ? `${doc.quality_score.toFixed(1)}%` : "not scored"}
                        </span>
                      </p>
                      <div className="pt-1 flex flex-wrap gap-2 text-[11px]">
                        {categoryCounts.length > 0 ? (
                          categoryCounts.map(([cat, n]) => (
                            <Badge key={cat} variant="outline">
                              {cat.replace(/_/g, " ")}: {n}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">No regions detected</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">Observations:</p>
                      {observations.length > 0 ? (
                        observations.map((o, i) => (
                          <div
                            key={i}
                            className="rounded border border-amber-500/20 bg-amber-500/5 p-2.5 text-muted-foreground leading-relaxed"
                          >
                            💡 {o}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">Nothing notable detected.</p>
                      )}
                    </div>
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
                          ? `${currentOcr.language} · ${(currentOcr.language_confidence * 100).toFixed(0)}% confidence · ${
                              currentOcr.source === "pdf_text_layer"
                                ? "PDF text layer"
                                : currentOcr.source === "tesseract"
                                  ? "OCR (Tesseract)"
                                  : currentOcr.source
                            }`
                          : "No extracted text."}
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
                      <p className="text-sm text-muted-foreground">
                        No extractable text for page {safePage}.
                      </p>
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

        {/* Collapsible Technical Details (Rule 5: Technical info under collapsible section) */}
        <Card className="border-border/60">
          <CardHeader className="py-3 px-4">
            <details className="group cursor-pointer">
              <summary className="flex items-center justify-between text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                <span className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-primary" /> Technical Details & Cryptographic Hashes
                </span>
                <span className="text-[11px] font-normal underline">Expand / Collapse</span>
              </summary>
              <div className="mt-4 space-y-3 pt-2 border-t text-xs">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Document UUID</p>
                    <code className="block mt-0.5 font-mono text-[11px] text-foreground bg-muted p-1.5 rounded">{doc.id}</code>
                  </div>
                  <div>
                    <p className="text-muted-foreground">SHA-256 Fingerprint</p>
                    <code className="block mt-0.5 font-mono text-[11px] text-foreground bg-muted p-1.5 rounded break-all">{doc.sha256_hash ?? "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0"}</code>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground mb-1">Normalized Bounding Box Coordinates (0.0 to 1.0)</p>
                  <div className="overflow-x-auto rounded bg-muted/60 p-2 font-mono text-[11px]">
                    {detections.map((d) => (
                      <div key={d.id} className="py-0.5">
                        <span className="font-bold">{d.category}:</span> x={d.bbox.x.toFixed(2)}, y={d.bbox.y.toFixed(2)}, w={d.bbox.w.toFixed(2)}, h={d.bbox.h.toFixed(2)} (conf: {(d.confidence * 100).toFixed(1)}%, sensitivity: {d.sensitivity})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </CardHeader>
        </Card>

        <AIDisclaimer />

        {/* Delete Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Document Permanently</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{doc.original_name}&quot;? This action cannot be undone.
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
