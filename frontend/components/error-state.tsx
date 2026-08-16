import { AlertCircle, RefreshCw } from "lucide-react";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ErrorState({
  error,
  onRetry,
  title = "Something went wrong",
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const apiError = error instanceof ApiClientError ? error : null;
  const message =
    apiError?.message ??
    (error instanceof Error ? error.message : "An unexpected error occurred.");

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6"
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {apiError?.code && <Badge variant="destructive">{apiError.code}</Badge>}
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {apiError?.status && (
        <p className="text-xs text-muted-foreground">HTTP {apiError.status}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      )}
    </div>
  );
}
