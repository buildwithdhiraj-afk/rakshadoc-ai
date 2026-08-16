"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { api, ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ProcessingJob } from "@/types";

export function ProcessingView({
  documentId,
  fileName,
}: {
  documentId: string;
  fileName?: string;
}) {
  const router = useRouter();
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [restarting, setRestarting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const j = await api.getProcessing(documentId);
      setJob(j);
      if (j.status === "completed") {
        stopPolling();
        router.push(`/dashboard/documents/${documentId}`);
      } else if (j.status === "failed") {
        stopPolling();
      }
    } catch (err) {
      stopPolling();
      setLoadError(err);
    }
  }, [documentId, router, stopPolling]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        await api.process(documentId);
        if (ignore) return;
        await poll();
        timer.current = setInterval(poll, 1000);
      } catch (err) {
        if (ignore) return;
        if (err instanceof ApiClientError && err.status === 409 && err.code === "ALREADY_PROCESSED") {
          setCancelled(true);
          stopPolling();
          return;
        }
        setLoadError(err);
      }
    }
    init();
    return () => {
      ignore = true;
      stopPolling();
    };
  }, [documentId, poll, stopPolling]);

  async function handleTryAgain() {
    setRestarting(true);
    setLoadError(null);
    setJob(null);
    try {
      await api.process(documentId);
      await poll();
      timer.current = setInterval(poll, 1000);
    } catch (err) {
      setLoadError(err);
    } finally {
      setRestarting(false);
    }
  }

  const steps = job?.steps ?? [
    "Document uploaded",
    "Quality analysis",
    "Image enhancement",
    "Layout detection",
    "OCR",
    "Sensitive element detection",
    "Protection",
    "Integrity verification",
    "Braille generation",
  ];

  const completedSet = new Set(job?.completed_steps ?? []);
  const done = job?.status === "completed";

  const stepState = (step: string) => {
    if (done || completedSet.has(step)) return "done";
    if (job?.status === "failed") return "pending";
    if (job?.current_step === step) return "running";
    return "pending";
  };

  if (cancelled) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          This document has already been processed.
        </p>
      </div>
    );
  }

  if (loadError && !job) {
    return <ErrorState error={loadError} onRetry={handleTryAgain} title="Processing failed to start" />;
  }

  const failedMessage = job?.status === "failed" ? job.error ?? "Processing failed." : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Processing document
          {fileName && (
            <Badge variant="outline" className="max-w-xs truncate font-normal">
              {fileName}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Running the RakshaDoc AI pipeline — this may take a few moments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {job ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  {done ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : job.status === "failed" ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {done
                    ? "Complete"
                    : job.status === "failed"
                      ? "Failed"
                      : job.current_step ?? "Starting…"}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round((job.progress ?? 0) * 100)}%
                </span>
              </div>
              <Progress value={Math.round((job.progress ?? 0) * 100)} />
            </div>

            <ol className="grid gap-2">
              {steps.map((step) => {
                const state = stepState(step);
                return (
                  <li
                    key={step}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                      state === "running" && "border-primary/40 bg-primary/5 font-medium text-foreground",
                      state === "done" && "border-border bg-card",
                      state === "pending" && "border-border bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {state === "done" ? (
                      <Check className="h-4 w-4 shrink-0 text-success" />
                    ) : state === "running" ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/40" />
                    )}
                    <span className="flex-1">{step}</span>
                    {state === "running" && <Badge variant="secondary">Running</Badge>}
                    {state === "done" && <Badge variant="success">Done</Badge>}
                  </li>
                );
              })}
            </ol>
          </>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        )}

        {job?.status === "failed" && (
          <div className="space-y-3">
            <ErrorState error={new Error(failedMessage ?? "Processing failed.")} />
            <Button onClick={handleTryAgain} disabled={restarting}>
              <RotateCcw className="h-4 w-4" />
              {restarting ? "Restarting…" : "Try Again"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
