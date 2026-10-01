import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-3xl border border-white/[0.08] bg-[#070b14]/90 text-card-foreground shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl transition-all duration-300",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/**
 * Double-Bezel Card Shell (Doppelrand Architecture)
 * Outer enclosure with padding + ring, wrapping inner card core.
 */
const DoubleBezelCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { innerClassName?: string }
>(({ className, innerClassName, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "group relative rounded-[2rem] p-1.5 md:p-2 bg-white/[0.03] ring-1 ring-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:ring-white/[0.18]",
      className,
    )}
    {...props}
  >
    <div
      className={cn(
        "relative rounded-[calc(2rem-0.375rem)] bg-[#070b14]/90 p-6 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/[0.04]",
        innerClassName,
      )}
    >
      {children}
    </div>
  </div>
));
DoubleBezelCard.displayName = "DoubleBezelCard";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight text-white font-heading", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-xs text-slate-400 leading-relaxed", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, DoubleBezelCard, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
