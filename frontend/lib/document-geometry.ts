/**
 * Geometry helpers for the document inspection viewer.
 *
 * The backend rasterizes every page to `page_N.png` and computes layout
 * detections on that exact image, so every bbox is normalized to [0,1] against
 * the page image (see backend/app/ml/document_detection.py `sanitize_bbox`).
 *
 * Because the viewer renders the very same image into a frame that preserves
 * its aspect ratio, a normalized bbox maps onto the frame by plain percentage —
 * no guessing, no double-scaling. These helpers centralize that mapping so the
 * viewer, the focus/scroll logic and any future overlay stay consistent.
 */

export type NormalizedBox = { x: number; y: number; w: number; h: number };

export type PageFrame = { width: number; height: number };

export type PixelBox = { x: number; y: number; width: number; height: number };

const MIN_PAGE_EDGE = 200;

/** Clamp a normalized box into the [0,1] unit square, dropping degenerate boxes. */
export function clampNormalizedBox(bbox: NormalizedBox): NormalizedBox | null {
  const { x, y, w, h } = bbox;
  if (![x, y, w, h].every((v) => Number.isFinite(v))) return null;
  if (w <= 0 || h <= 0) return null;
  const cx = Math.min(Math.max(x, 0), 1);
  const cy = Math.min(Math.max(y, 0), 1);
  const cw = Math.min(Math.max(w, 0), 1 - cx);
  const ch = Math.min(Math.max(h, 0), 1 - cy);
  if (cw <= 0 || ch <= 0) return null;
  return { x: cx, y: cy, w: cw, h: ch };
}

/**
 * Map a normalized bbox into CSS pixels inside the displayed page frame.
 * `frame` is the rendered (pre-zoom) size of the page image.
 */
export function scaleBoundingBox(bbox: NormalizedBox, frame: PageFrame): PixelBox | null {
  const box = clampNormalizedBox(bbox);
  if (!box) return null;
  return {
    x: box.x * frame.width,
    y: box.y * frame.height,
    width: box.w * frame.width,
    height: box.h * frame.height,
  };
}

/**
 * Fit a page of `natural` size inside `available`, preserving aspect ratio.
 * Never returns a zero edge: a collapsed frame is what makes overlays collapse
 * into a thin strip when the page image fails to load.
 */
export function calculateDocumentFrame(
  natural: { w: number; h: number } | null,
  available: { width: number; height: number },
  fitMode: "width" | "page",
): PageFrame {
  const availW = Math.max(MIN_PAGE_EDGE, available.width);
  const availH = Math.max(MIN_PAGE_EDGE, available.height);

  // Before the image reports its intrinsic size, fall back to A4 portrait so
  // the page still renders as a page-shaped sheet instead of collapsing.
  const natW = natural?.w && natural.w > 0 ? natural.w : 1200;
  const natH = natural?.h && natural.h > 0 ? natural.h : 1699;
  const ratio = natH / natW;

  const widthFit = availW;
  const heightFit = availH / ratio;
  const width = fitMode === "page" ? Math.min(widthFit, heightFit) : widthFit;

  return {
    width: Math.round(width),
    height: Math.round(width * ratio),
  };
}

/** Detections belonging to `page`, tolerating 0- or 1-indexed backends. */
export function getPageDetections<T extends { page: number }>(
  detections: T[],
  page: number,
): T[] {
  return detections.filter((d) => d.page === page);
}
