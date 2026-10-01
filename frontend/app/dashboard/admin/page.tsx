"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import type { AdminMetrics, AuditEvent } from "@/types";

type MetricCard = {
  label: string;
  value: string;
  muted: boolean;
  icon: typeof Activity;
};

function metricCards(m: AdminMetrics | null): MetricCard[] {
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
    {
      label: "Model Status",
      value: m ? (m.model_available ? "Loaded" : "Demo fallback") : "—",
      muted: false,
      icon: ShieldAlert,
    },
  ];
}

export default function AdminPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = async () => {
    if (user?.role !== "admin") return;
    setLoading(true);
    setError(null);
    try {
      const [m, a] = await Promise.all([
        api.adminMetrics().then((r) => r as unknown as AdminMetrics),
        api.adminAuditLogs(),
      ]);
      setMetrics(m);
      setAudit(a);
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
      api.adminAuditLogs(),
    ])
      .then(([m, a]) => {
        if (ignore) return;
        setMetrics(m);
        setAudit(a);
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
          icon={ShieldAlert}
          title="Admin access required"
          description="System metrics and audit logs are only available to users with the admin role."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const mCards = metricCards(metrics);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            System metrics and audit trails.
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
