import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-9 w-9", className)}
    >
      <path
        d="M12 6h16l8 8v24a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z"
        fill="#0d2b52"
      />
      <path d="M28 6v8h8" fill="#0d2b52" />
      <path d="M16 22h10M16 27h10M16 32h7" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M24 40l-2.2-1.8A12.5 12.5 0 0 1 24 20.2a12.5 12.5 0 0 1 2.2 18L24 40Z"
        fill="#ee7a1b"
      />
      <circle cx="24" cy="29.6" r="2.6" fill="#f8fafc" />
      <path d="M24 24.6v1.6M24 33v1.6M20.4 29.6H22M26 29.6h1.6" stroke="#f8fafc" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className="text-lg font-bold tracking-tight text-foreground">
          RakshaDoc <span className="text-saffron">AI</span>
        </span>
        {subtitle && (
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Understand · Protect · Verify · Access
          </span>
        )}
      </span>
    </span>
  );
}
