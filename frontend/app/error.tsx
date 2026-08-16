"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log boundary error silently
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <div className="rounded-full bg-destructive/10 p-4 text-destructive">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred while loading this page. Stack traces are suppressed for
              security.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <Button variant="outline" onClick={reset}>
                <RefreshCw className="h-4 w-4" /> Try Again
              </Button>
              <Button asChild variant="saffron">
                <Link href="/">
                  <Home className="h-4 w-4" /> Return Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
