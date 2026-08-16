"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  FileScan,
  FileText,
  FolderOpen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge, RiskBadge } from "@/components/dashboard/status-badges";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { formatDate, formatBytes } from "@/lib/utils";
import type { Document } from "@/types";

const quickActions = [
  {
    href: "/dashboard/analyze",
    title: "Analyze a Document",
    desc: "Upload and run the full document pipeline.",
    icon: FileScan,
  },
  {
    href: "/dashboard/documents",
    title: "My Documents",
    desc: "Browse your document history and analyses.",
    icon: FolderOpen,
  },
  {
    href: "/dashboard/verify",
    title: "Verify Integrity",
    desc: "Confirm a document has not been altered.",
    icon: ShieldCheck,
  },
  {
    href: "/dashboard/braille",
    title: "Braille Output",
    desc: "Generate accessible Braille-ready text.",
    icon: Accessibility,
  },
];

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDocuments(await api.listDocuments());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    api
      .listDocuments()
      .then((data) => {
        if (!ignore) setDocuments(data);
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
  }, []);

  const recent = documents.slice(0, 5);
  const firstName = user?.full_name?.split(" ")[0] ?? user?.email ?? "there";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Understand, protect, verify and access your multilingual documents.
          </p>
        </div>
        <Button asChild variant="saffron">
          <Link href="/dashboard/analyze">
            <FileScan className="h-4 w-4" /> Analyze a Document
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href} className="group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-primary/5 p-2.5 text-primary">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{a.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recent Documents</CardTitle>
            <CardDescription>Your most recently uploaded documents.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/documents">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : error ? (
            <ErrorState error={error} onRetry={load} title="Could not load documents" />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload your first document to run layout analysis, OCR, sensitive element detection, integrity verification and Braille output."
              action="Analyze a Document"
              actionHref="/dashboard/analyze"
            />
          ) : (
            <ul className="divide-y">
              {recent.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/dashboard/documents/${doc.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {doc.original_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(doc.size_bytes)} · {doc.page_count} page
                          {doc.page_count !== 1 ? "s" : ""} · {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.demo && (
                        <Badge variant="demo">
                          <Sparkles className="h-3 w-3" /> Demo
                        </Badge>
                      )}
                      <StatusBadge status={doc.status} />
                      <RiskBadge risk={doc.tamper_risk} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-saffron/10 text-accent-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Demo Mode</h3>
              <Badge variant="demo">Simulated Analysis</Badge>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Until trained models are connected, layout detection, OCR and sensitive-element
              analysis are simulated and clearly labelled. Hash verification, protected copies and
              Braille translation are real. Results shown are for demonstration only.
            </p>
          </div>
          <Separator className="hidden sm:block sm:h-10 sm:w-px" />
          <Button asChild variant="outline" size="sm">
            <Link href="/research">Learn more</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
