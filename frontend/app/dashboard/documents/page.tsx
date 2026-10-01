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
import { DoubleBezelCard } from "@/components/ui/card";
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
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/dashboard/documents/${doc.id}`}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        aria-label={`View ${doc.original_name}`}
      >
        <Eye className="h-3.5 w-3.5" />
      </Link>
      <Link
        href={`/dashboard/verify?doc=${doc.id}`}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition-colors hover:bg-emerald-500/20"
        aria-label={`Verify ${doc.original_name}`}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
      </Link>
      <Link
        href={`/dashboard/documents/${doc.id}/protect`}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400 transition-colors hover:bg-amber-500/20"
        aria-label={`Protect ${doc.original_name}`}
      >
        <ShieldPlus className="h-3.5 w-3.5" />
      </Link>
      <button
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
        aria-label={`Delete ${doc.original_name}`}
        onClick={() => setDeleteTarget(doc)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-300">
            Vault Index
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white font-heading sm:text-3xl">
            Document Repository
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Encrypted vault holding processed Indic document layouts, redactions, and verification hashes.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <DoubleBezelCard innerClassName="p-6">
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full bg-white/5 rounded-2xl" />
            ))}
          </div>
        </DoubleBezelCard>
      ) : error ? (
        <ErrorState error={error} onRetry={load} title="Could not load documents" />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Vault is currently empty"
          description="Upload and analyze a document to view layout detection, privacy redaction, and cryptographic proofs."
          action="Analyze a Document"
          actionHref="/dashboard/analyze"
        />
      ) : (
        <>
          <DoubleBezelCard innerClassName="p-0 overflow-hidden hidden md:block">
            <Table>
              <TableHeader className="border-b border-white/[0.08] bg-black/40">
                <TableRow className="border-b border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-xs font-mono text-slate-400 pl-6">Document Name</TableHead>
                  <TableHead className="text-xs font-mono text-slate-400">Date Ingested</TableHead>
                  <TableHead className="text-xs font-mono text-slate-400">Pages</TableHead>
                  <TableHead className="text-xs font-mono text-slate-400">Quality</TableHead>
                  <TableHead className="text-xs font-mono text-slate-400">Pipeline State</TableHead>
                  <TableHead className="text-xs font-mono text-slate-400">Tamper Risk</TableHead>
                  <TableHead className="text-right text-xs font-mono text-slate-400 pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="border-b border-white/[0.05] transition-colors hover:bg-white/[0.02]"
                  >
                    <TableCell className="pl-6">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 group-hover:text-amber-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-xs truncate text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                            {doc.original_name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            {formatBytes(doc.size_bytes)} · {doc.demo ? "Demo Seed" : doc.mime_type}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-slate-400">
                      {formatDate(doc.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-300">{doc.page_count}</TableCell>
                    <TableCell>
                      {doc.quality_score != null ? (
                        <span className="font-mono text-xs text-emerald-400 font-semibold">
                          {doc.quality_score.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell>
                      <RiskBadge risk={doc.tamper_risk} />
                    </TableCell>
                    <TableCell className="text-right pr-6">{actions(doc)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DoubleBezelCard>

          <div className="grid gap-4 md:hidden">
            {documents.map((doc) => (
              <DoubleBezelCard key={doc.id} innerClassName="p-4 space-y-3">
                <Link href={`/dashboard/documents/${doc.id}`} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">
                      {doc.original_name}
                    </p>
                    <p className="font-mono text-[10px] text-slate-400">
                      {formatBytes(doc.size_bytes)} · {doc.page_count} page
                      {doc.page_count !== 1 ? "s" : ""} · {formatDate(doc.created_at)}
                    </p>
                  </div>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={doc.status} />
                  <RiskBadge risk={doc.tamper_risk} />
                  {doc.demo && <Badge variant="demo">Demo</Badge>}
                </div>
                <div className="border-t border-white/[0.08] pt-3">{actions(doc)}</div>
              </DoubleBezelCard>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="rounded-3xl border border-white/10 bg-[#070b14] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Delete document from vault?</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Removing this document will purge its underlying storage bytes and analysis records from
              the active session.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {deleteError instanceof ApiClientError
                ? deleteError.message
                : deleteError instanceof Error
                  ? deleteError.message
                  : "Could not delete document."}
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
            >
              {deleting ? "Purging bytes…" : "Delete Permanently"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
