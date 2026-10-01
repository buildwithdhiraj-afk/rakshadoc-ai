"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/error-state";
import { api, ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ProcessingJob } from "@/types";

const DISPLAY_STEPS = [
  "Document uploaded",
  "Quality analysis",
  "Image enhancement",
  "Layout detection",
  "OCR text extraction",
  "Sensitive element detection",
  "Protection preparation",
  "Integrity verification",
  "Accessibility/Braille preparation",
];

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

  const completedCount = job?.completed_steps?.length ?? 0;
  const done = job?.status === "completed";

  const getStepStatus = (index: number) => {
    if (done || index < completedCount) return "done";
    if (job?.status === "failed") return "failed";
    if (index === completedCount) return "running";
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
  const rawProgress = job?.progress ?? (completedCount / DISPLAY_STEPS.length);
  const progressPct = Math.round(Math.min(100, Math.max(5, rawProgress * 100)));

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Document Analysis in Progress
          </CardTitle>
          {fileName && (
            <Badge variant="outline" className="max-w-xs truncate font-medium">
              {fileName}
            </Badge>
          )}
        </div>
        <CardDescription>
          Running 9-step RakshaDoc AI intelligence & security analysis pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-foreground">
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : job?.status === "failed" ? (
                <XCircle className="h-4 w-4 text-destructive" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {done
                ? "Document Analysis Complete"
                : job?.status === "failed"
                  ? "Pipeline Execution Failed"
                  : DISPLAY_STEPS[Math.min(completedCount, DISPLAY_STEPS.length - 1)]}
            </span>
            <span className="tabular-nums font-semibold text-primary">
              {progressPct}%
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        <ol className="grid gap-2">
          {DISPLAY_STEPS.map((stepName, index) => {
            const status = getStepStatus(index);
            return (
              <li
                key={stepName}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-all",
                  status === "running" && "border-primary/50 bg-primary/5 font-semibold text-foreground shadow-sm",
                  status === "done" && "border-emerald-200 bg-emerald-50/50 text-foreground dark:border-emerald-950 dark:bg-emerald-950/20",
                  status === "pending" && "border-border bg-muted/20 text-muted-foreground",
                  status === "failed" && "border-destructive/40 bg-destructive/5 text-destructive",
                )}
              >
                {status === "done" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : status === "running" ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] text-muted-foreground">
                    {index + 1}
                  </span>
                )}
                <span className="flex-1">{stepName}</span>
                {status === "running" && <Badge variant="secondary" className="animate-pulse">Processing</Badge>}
                {status === "done" && <Badge variant="success">Completed</Badge>}
                {status === "pending" && <span className="text-xs text-muted-foreground">Pending</span>}
              </li>
            );
          })}
        </ol>

        {job?.status === "failed" && (
          <div className="space-y-3 pt-2">
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

