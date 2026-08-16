"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Brain,
  Clock,
  FlaskConical,
  Gauge,
  Lock,
  ScanLine,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type {
  AdminMetrics,
  AuditEvent,
  Experiment,
  ModelInfo,
} from "@/types";

type MetricCard = {
  label: string;
  value: string;
  muted: boolean;
  icon: typeof Activity;
};

function metricCards(m: AdminMetrics | null): MetricCard[] {
  const f = (v: number | null, suffix = "%") =>
    v == null ? "Not evaluated" : `${(v * 100).toFixed(1)}${suffix}`;
  return [
    {
      label: "Documents Processed",
      value: m ? String(m.documents_processed) : "—",
      muted: false,
      icon: Activity,
    },
    {
      label: "Average Processing Time",
      value: m ? `${m.average_processing_time_s}s` : "—",
      muted: false,
      icon: Clock,
    },
    { label: "Layout mAP", value: m ? f(m.layout_map) : "—", muted: m ? m.layout_map == null : true, icon: ScanLine },
    { label: "OCR Accuracy", value: m ? f(m.ocr_accuracy) : "—", muted: m ? m.ocr_accuracy == null : true, icon: Gauge },
    { label: "Sensitive Element mAP", value: m ? f(m.sensitive_map) : "—", muted: m ? m.sensitive_map == null : true, icon: Lock },
    { label: "Tamper Detection F1", value: m ? f(m.tamper_f1) : "—", muted: m ? m.tamper_f1 == null : true, icon: ShieldAlert },
    { label: "Model Size", value: m ? (m.model_size_mb != null ? `${m.model_size_mb} MB` : "Not evaluated") : "—", muted: m ? m.model_size_mb == null : true, icon: Brain },
    { label: "Average Memory", value: m ? (m.average_memory_mb != null ? `${m.average_memory_mb} MB` : "Not evaluated") : "—", muted: m ? m.average_memory_mb == null : true, icon: Brain },
  ];
}

const EXPERIMENT_METRICS = [
  { key: "map", label: "mAP" },
  { key: "precision", label: "Precision" },
  { key: "recall", label: "Recall" },
  { key: "f1", label: "F1" },
  { key: "inference_time", label: "Inference time" },
  { key: "model_size", label: "Model size" },
];

function fmtMetric(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  if (typeof v === "number") {
    if (v < 10) return v.toFixed(2);
    return v.toFixed(0);
  }
  return String(v);
}

export default function AdminPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = async () => {
    if (user?.role !== "admin") return;
    setLoading(true);
    setError(null);
    try {
      const [m, e, a, mo] = await Promise.all([
        api.adminMetrics().then((r) => r as unknown as AdminMetrics),
        api.adminExperiments(),
        api.adminAuditLogs(),
        api.adminModels(),
      ]);
      setMetrics(m);
      setExperiments(e);
      setAudit(a);
      setModels(mo);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    let ignore = false;
    Promise.all([
      api.adminMetrics().then((r) => r as unknown as AdminMetrics),
      api.adminExperiments(),
      api.adminAuditLogs(),
      api.adminModels(),
    ])
      .then(([m, e, a, mo]) => {
        if (ignore) return;
        setMetrics(m);
        setExperiments(e);
        setAudit(a);
        setModels(mo);
      })
      .catch((err) => {
        if (!ignore) setError(err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user?.role]);

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState
          icon={FlaskConical}
          title="Admin access required"
          description="Research metrics, experiments, audit logs and model information are only available to users with the admin role."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const mCards = metricCards(metrics);
  const mapChartData = experiments
    .filter((e) => e.status === "evaluated")
    .map((e) => ({ e, map: e.metrics?.map }))
    .filter((d): d is { e: Experiment; map: number } => typeof d.map === "number");
  const maxMap = mapChartData.length ? Math.max(...mapChartData.map((d) => d.map as number)) : 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin & Research</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            System metrics, experiment evaluation and audit trails.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error ? <ErrorState error={error} onRetry={load} title="Could not load admin data" /> : null}

      {metrics && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Metrics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mCards.map((c) => (
              <Card key={c.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {c.label}
                    </p>
                    <c.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p
                    className={
                      c.muted
                        ? "mt-2 text-sm font-medium text-muted-foreground"
                        : "mt-2 text-2xl font-bold tabular-nums text-foreground"
                    }
                  >
                    {c.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={metrics.model_available ? "success" : "warning"}>
              {metrics.model_available ? "Model loaded" : "Model not available"}
            </Badge>
            <Badge variant="demo">{metrics.demo_mode ? "Demo Mode" : "Live Mode"}</Badge>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Experiments
        </h2>
        {experiments.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">No experiments have been registered yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {mapChartData.length > 0 ? (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-base">mAP Comparison</CardTitle>
                  <CardDescription className="text-xs">
                    Layout detection mAP across evaluated experiments.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mapChartData.map(({ e, map }) => (
                      <div key={e.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{e.short_name}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {(map * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, (map / maxMap) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
                No experiment has an evaluated mAP yet. Metrics appear here once experiments are
                actually run and evaluated.
              </p>
            )}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Experiment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>mAP</TableHead>
                        <TableHead>Precision</TableHead>
                        <TableHead>Recall</TableHead>
                        <TableHead>F1</TableHead>
                        <TableHead>Inference time</TableHead>
                        <TableHead>Model size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {experiments.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{e.short_name}</p>
                              <p className="max-w-xs truncate text-xs text-muted-foreground">
                                {e.name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {e.status === "evaluated" ? (
                              <Badge variant="success">Evaluated</Badge>
                            ) : (
                              <Badge variant="outline">Not evaluated</Badge>
                            )}
                          </TableCell>
                          {EXPERIMENT_METRICS.map((m) => (
                            <TableCell key={m.key} className="tabular-nums text-muted-foreground">
                              {fmtMetric(e.metrics?.[m.key])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Models
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {models.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">No model information registered.</p>
              </CardContent>
            </Card>
          ) : (
            models.map((m) => (
              <Card key={`${m.name}-${m.version}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{m.name}</p>
                    <Badge variant={m.available ? "success" : "warning"}>
                      {m.available ? "Available" : "Not available"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    v{m.version} · backend: {m.backend} · {m.loaded ? "loaded" : "not loaded"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{m.input}</p>
                  {m.notes && <p className="mt-2 text-xs text-muted-foreground">{m.notes}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Audit Logs
        </h2>
        <Card>
          <CardContent className="p-0">
            {audit.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No audit events recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audit.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium text-foreground">{e.action}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {e.user_id ? e.user_id.slice(0, 8) : "system"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {e.document_id ? e.document_id.slice(0, 8) : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(e.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
