import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-amber-500/30 to-orange-500/0 blur-sm"></div>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="relative h-9 w-9"
      >
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          className="fill-slate-900/90 stroke-white/15"
          strokeWidth="1.5"
        />
        {/* Document Silhouette */}
        <path
          d="M14 13C14 11.8954 14.8954 11 16 11H26L34 19V35C34 36.1046 33.1046 37 32 37H16C14.8954 37 14 36.1046 14 35V13Z"
          fill="#0f172a"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.2"
        />
        <path d="M26 11V19H34" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" fill="#1e293b" />
        {/* Abstract Micro Scan Lines */}
        <path d="M19 23H29" stroke="rgba(245,158,11,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19 27H27" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19 31H24" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Shield / Security Diamond Node */}
        <path
          d="M29 27L36 30.5V36C36 39.5 32 41.5 29 42.5C26 41.5 22 39.5 22 36V30.5L29 27Z"
          fill="url(#saffronGrad)"
          stroke="#fbbf24"
          strokeWidth="1"
        />
        <circle cx="29" cy="35" r="1.5" fill="#030712" />
        <defs>
          <linearGradient id="saffronGrad" x1="22" y1="27" x2="36" y2="42.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function Logo({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <span className={cn("group flex items-center gap-3 select-none", className)}>
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className="flex items-center gap-1 text-base font-bold tracking-tight text-white font-heading">
          RakshaDoc{" "}
          <span className="rounded-md bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            AI
          </span>
        </span>
        {subtitle && (
          <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Intelligence · Security · Braille
          </span>
        )}
      </span>
    </span>
  );
}
