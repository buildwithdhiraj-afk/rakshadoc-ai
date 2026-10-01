import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium tracking-wide transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
        secondary:
          "border border-white/10 bg-white/5 text-slate-300",
        outline:
          "border border-white/15 bg-transparent text-slate-200",
        success:
          "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
        warning:
          "border border-amber-500/30 bg-amber-500/10 text-amber-300",
        destructive:
          "border border-red-500/30 bg-red-500/10 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.15)]",
        saffron:
          "border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
        demo:
          "border border-amber-400/40 bg-amber-400/10 text-amber-300 uppercase tracking-widest text-[9px] font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
