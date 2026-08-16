import { cn } from "@/lib/utils";

interface BoxSpec {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const boxes: BoxSpec[] = [
  { label: "Title", x: 42, y: 42, w: 230, h: 28, color: "#2563eb" },
  { label: "Table", x: 42, y: 88, w: 150, h: 74, color: "#0d9488" },
  { label: "Paragraph", x: 205, y: 88, w: 230, h: 74, color: "#7c3aed" },
  { label: "Signature", x: 42, y: 176, w: 105, h: 42, color: "#dc2626" },
  { label: "Official Stamp", x: 200, y: 176, w: 72, h: 72, color: "#ee7a1b" },
];

export function SampleDocument({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-white shadow-xl">
        <svg viewBox="0 0 320 280" className="block h-auto w-full" role="img" aria-label="Synthetic sample document with AI detection boxes for title, table, paragraph, signature and official stamp">
          <rect width="320" height="280" fill="#fdfcfb" />
          <rect x="32" y="22" width="256" height="8" rx="2" fill="#d6dde6" />
          <rect x="32" y="40" width="160" height="6" rx="2" fill="#e3e8ef" />
          <rect x="32" y="54" width="230" height="6" rx="2" fill="#e3e8ef" />
          <rect x="32" y="68" width="200" height="6" rx="2" fill="#e3e8ef" />
          <rect x="32" y="82" width="150" height="80" rx="4" fill="#eef2f7" stroke="#d6dde6" />
          <rect x="52" y="98" width="110" height="4" rx="2" fill="#c7d0db" />
          <rect x="52" y="110" width="110" height="4" rx="2" fill="#d6dde6" />
          <rect x="52" y="122" width="110" height="4" rx="2" fill="#d6dde6" />
          <rect x="52" y="134" width="70" height="4" rx="2" fill="#d6dde6" />
          <rect x="200" y="82" width="88" height="80" rx="4" fill="#f6f5f2" stroke="#e3e8ef" />
          <rect x="216" y="98" width="56" height="4" rx="2" fill="#c7d0db" />
          <rect x="216" y="110" width="56" height="4" rx="2" fill="#d6dde6" />
          <rect x="216" y="122" width="40" height="4" rx="2" fill="#d6dde6" />
          <rect x="216" y="134" width="48" height="4" rx="2" fill="#d6dde6" />
          <path
            d="M52 190c14-6 22-14 26-26 4 14 14 22 30 26-14 5-22 14-26 26-4-14-14-22-30-26Z"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          <circle cx="210" cy="212" r="30" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx="210" cy="212" r="22" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M200 212h20M210 202v20" stroke="#94a3b8" strokeWidth="1" />
        </svg>

        {boxes.map((b) => (
          <div
            key={b.label}
            className="pointer-events-none absolute"
            style={{
              left: `${(b.x / 320) * 100}%`,
              top: `${(b.y / 280) * 100}%`,
              width: `${(b.w / 320) * 100}%`,
              height: `${(b.h / 280) * 100}%`,
            }}
          >
            <div
              className="h-full w-full rounded-sm border-2"
              style={{ borderColor: b.color, opacity: 0.9 }}
            />
            <span
              className="absolute -top-6 left-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: b.color }}
            >
              {b.label}
            </span>
          </div>
        ))}
      </div>

      <div className="absolute -right-3 -top-3 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
        AI Analysis
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Synthetic sample — not an official document
      </p>
    </div>
  );
}
