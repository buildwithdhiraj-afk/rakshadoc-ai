"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { ProcessingView } from "@/components/dashboard/processing-view";
import { api } from "@/lib/api";
import type { Document } from "@/types";

export default function DocumentProcessingPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getDocument(id)
      .then(setDoc)
      .catch(setError);
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <FileSearch className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Processing</h1>
        {doc?.demo && <Badge variant="demo">Demo Document</Badge>}
      </div>

      {error ? (
        <ErrorState error={error} title="Could not load document" />
      ) : !doc ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <ProcessingView documentId={doc.id} fileName={doc.original_name} />
      )}
    </div>
  );
}
