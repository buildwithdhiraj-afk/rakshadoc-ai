"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Home, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { PublicVerification } from "@/types";

export default function PublicVerifyPage() {
  const { verification_id } = useParams<{ verification_id: string }>();
  const [record, setRecord] = useState<PublicVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!verification_id) return;
    api
      .verifyPublic(verification_id)
      .then(setRecord)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [verification_id]);

  const valid = record?.integrity_status === "VALID";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center border-b bg-card px-4 sm:px-6">
        <Link href="/" aria-label="RakshaDoc AI home">
          <Logo />
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-card">
              <CardTitle className="flex items-center gap-2 text-base">
                Public Integrity Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : error ? (
                <ErrorState error={error} title="Verification not found" />
              ) : record ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 rounded-lg border bg-muted/40 p-4">
                    {valid ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : (
                      <ShieldAlert className="h-6 w-6 text-destructive" />
                    )}
                    <p className="text-lg font-bold text-foreground">
                      {valid ? "INTEGRITY VALID" : "INTEGRITY CHECK FAILED"}
                    </p>
                  </div>

                  <dl className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-sm text-muted-foreground">Document ID</dt>
                      <dd className="font-mono text-sm font-semibold text-foreground">
                        {record.document_id_masked}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-sm text-muted-foreground">Protected Copy</dt>
                      <dd className="text-sm font-semibold text-foreground">
                        {record.protected_copy_available ? "✓ Available" : "—"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-sm text-muted-foreground">Braille Output</dt>
                      <dd className="text-sm font-semibold text-foreground">
                        {record.braille_available ? "✓ Available" : "—"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-sm text-muted-foreground">Verification Date</dt>
                      <dd className="text-sm font-semibold text-foreground">
                        {formatDate(record.created_at)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-sm text-muted-foreground">Processing Version</dt>
                      <dd className="text-sm font-semibold text-foreground">{record.version}</dd>
                    </div>
                  </dl>

                  {record.tamper_risk && (
                    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
                      <span className="text-sm text-muted-foreground">Recorded Tamper Risk</span>
                      <Badge
                        variant={
                          record.tamper_risk === "LOW"
                            ? "success"
                            : record.tamper_risk === "MEDIUM"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {record.tamper_risk}
                      </Badge>
                    </div>
                  )}

                  <p className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
                    {record.notice}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            This verification confirms recorded file integrity information. It is not a legal
            certification of document authenticity.
          </p>

          <div className="mt-6 flex justify-center">
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <Home className="h-4 w-4" /> Back to RakshaDoc AI
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground">© 2026 RakshaDoc AI</p>
          <p className="text-xs text-muted-foreground">Understand · Protect · Verify · Access</p>
        </div>
      </footer>
    </div>
  );
}
