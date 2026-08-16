"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Eye,
  FileText,
  FolderOpen,
  RefreshCw,
  ShieldCheck,
  ShieldPlus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { StatusBadge, RiskBadge } from "@/components/dashboard/status-badges";
import { api, ApiClientError } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";
import type { Document } from "@/types";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<unknown>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setDocuments(await api.listDocuments());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

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

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteDocument(deleteTarget.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err);
    } finally {
      setDeleting(false);
    }
  }

  const actions = (doc: Document) => (
    <div className="flex items-center gap-1.5">
      <Button asChild variant="ghost" size="icon-sm" aria-label={`View ${doc.original_name}`}>
        <Link href={`/dashboard/documents/${doc.id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon-sm" aria-label={`Verify ${doc.original_name}`}>
        <Link href={`/dashboard/verify?doc=${doc.id}`}>
          <ShieldCheck className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon-sm" aria-label={`Protect ${doc.original_name}`}>
        <Link href={`/dashboard/documents/${doc.id}/protect`}>
          <ShieldPlus className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:text-destructive"
        aria-label={`Delete ${doc.original_name}`}
        onClick={() => setDeleteTarget(doc)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every document you have uploaded, analyzed and protected.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <ErrorState error={error} onRetry={load} title="Could not load documents" />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents yet"
          description="Upload a document to see layout detection, sensitive-element protection, integrity verification and Braille output."
          action="Analyze a Document"
          actionHref="/dashboard/analyze"
        />
      ) : (
        <>
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Pages</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/documents/${doc.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-xs truncate font-medium text-foreground hover:underline">
                              {doc.original_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatBytes(doc.size_bytes)} · {doc.demo ? "Demo" : doc.mime_type}
                            </p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(doc.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{doc.page_count}</TableCell>
                      <TableCell>
                        {doc.quality_score != null ? (
                          <span className="tabular-nums text-muted-foreground">
                            {doc.quality_score.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={doc.status} />
                      </TableCell>
                      <TableCell>
                        <RiskBadge risk={doc.tamper_risk} />
                      </TableCell>
                      <TableCell className="text-right">{actions(doc)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:hidden">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <Link href={`/dashboard/documents/${doc.id}`} className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {doc.original_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(doc.size_bytes)} · {doc.page_count} page
                        {doc.page_count !== 1 ? "s" : ""} · {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </Link>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={doc.status} />
                    <RiskBadge risk={doc.tamper_risk} />
                    {doc.demo && (
                      <Badge variant="demo">Demo</Badge>
                    )}
                  </div>
                  <div className="mt-3 border-t pt-3">{actions(doc)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              Deleting this document will remove its stored processing data according to the
              configured retention policy.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {deleteError instanceof ApiClientError
                ? deleteError.message
                : deleteError instanceof Error
                  ? deleteError.message
                  : "Could not delete the document."}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
