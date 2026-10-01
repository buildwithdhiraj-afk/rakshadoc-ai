"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Loader2, LogIn, Sparkles, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DoubleBezelCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const { user, initialized, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialized && !loading && user) {
      router.replace(next ?? "/dashboard");
    }
  }, [initialized, loading, user, next, router]);

  const go = (path: string) => router.replace(next ?? path);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      go("/dashboard");
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DoubleBezelCard innerClassName="p-6 md:p-8">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-heading">
            Sign In to Console
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Access your secure document intelligence environment.
          </p>
        </div>
        <Badge variant="demo" className="text-[9px]">
          Demo Ready
        </Badge>
      </div>

      <div className="mt-6 space-y-4">
        {error ? <ErrorState error={error} title="Unable to sign in" /> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-mono text-slate-300">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="operator@rakshadoc.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-white/10 bg-white/[0.03] text-xs text-white placeholder:text-slate-400 focus-visible:border-amber-500/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-mono text-slate-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border-white/10 bg-white/[0.03] text-xs text-white placeholder:text-slate-400 focus-visible:border-amber-500/50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="group relative flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 py-3 text-xs font-semibold text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] active:scale-98 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
            ) : (
              <>
                <span>Authenticate Session</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 py-2.5 text-xs font-mono text-amber-300 transition-colors hover:bg-amber-500/20"
            onClick={() => {
              setEmail("user@rakshadoc.dev");
              setPassword("RakshaDoc!Dev1");
              setError(null);
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Load Quick Demo Credentials</span>
          </button>
        </div>

        <p className="border-t border-white/[0.08] pt-4 text-center text-xs text-slate-400">
          New researcher?{" "}
          <Link href="/register" className="font-semibold text-amber-400 hover:text-amber-300">
            Create an account
          </Link>
        </p>
      </div>
    </DoubleBezelCard>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#030712] px-4 py-12 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,0.08),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="RakshaDoc AI home">
            <Logo />
          </Link>
        </div>

        <Suspense fallback={<Skeleton className="h-96 w-full bg-white/5 rounded-3xl" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Return to landing page
          </Link>
        </p>
      </div>
    </div>
  );
}
