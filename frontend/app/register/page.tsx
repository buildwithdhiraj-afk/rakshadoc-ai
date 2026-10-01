"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Loader2, Sparkles, UserPlus } from "lucide-react";
import { Logo } from "@/components/logo";
import { DoubleBezelCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(new Error("Password must be at least 8 characters."));
      return;
    }
    if (password !== confirm) {
      setError(new Error("Passwords do not match."));
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password, fullName.trim());
      router.replace(next ?? "/dashboard");
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
            Initialize Access
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Create an encrypted document intelligence workspace.
          </p>
        </div>
        <Badge variant="saffron" className="text-[9px]">
          FIPS 180-4 Ready
        </Badge>
      </div>

      <div className="mt-6 space-y-4">
        {error ? <ErrorState error={error} title="Unable to register" /> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-xs font-mono text-slate-300">
              Full Name
            </Label>
            <Input
              id="full_name"
              autoComplete="name"
              placeholder="Dr. Anand Deshmukh"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-xl border-white/10 bg-white/[0.03] text-xs text-white placeholder:text-slate-400 focus-visible:border-amber-500/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-mono text-slate-300">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="anand@institution.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-white/10 bg-white/[0.03] text-xs text-white placeholder:text-slate-400 focus-visible:border-amber-500/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-mono text-slate-300">
              Security Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border-white/10 bg-white/[0.03] text-xs text-white placeholder:text-slate-400 focus-visible:border-amber-500/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-xs font-mono text-slate-300">
              Confirm Password
            </Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
                <span>Create Workspace</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </>
            )}
          </button>
        </form>

        <p className="border-t border-white/[0.08] pt-4 text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-amber-400 hover:text-amber-300">
            Sign In
          </Link>
        </p>
      </div>
    </DoubleBezelCard>
  );
}

export default function RegisterPage() {
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
          <RegisterForm />
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
