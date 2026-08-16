import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  action,
  actionHref,
  onAction,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action &&
        (actionHref ? (
          <Button asChild variant="saffron" size="sm" className="mt-2">
            <a href={actionHref}>{action}</a>
          </Button>
        ) : (
          <Button variant="saffron" size="sm" className="mt-2" onClick={onAction}>
            {action}
          </Button>
        ))}
    </div>
  );
}
