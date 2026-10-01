"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanText,
  ShieldCheck,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const publicLinks = [
  { href: "/features", label: "Capabilities" },
  { href: "/how-it-works", label: "Pipeline" },
  { href: "/security", label: "Security & Trust" },
  { href: "/accessibility", label: "Braille Engine" },
  { href: "/about", label: "About" },
];

const appLinks = [
  { href: "/dashboard", label: "Console", icon: LayoutDashboard },
  { href: "/dashboard/documents", label: "Vault", icon: ScanText },
  { href: "/dashboard/verify", label: "Integrity", icon: ShieldCheck },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentUser = user;

  const initials = (currentUser?.full_name ?? currentUser?.email ?? "G")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="fixed top-4 inset-x-0 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-6xl transition-all duration-500">
      <div className="relative rounded-full border border-white/10 bg-[#070b14]/80 p-1.5 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
        <div className="flex h-12 items-center justify-between px-3 md:px-5">
          {/* Logo Brand */}
          <Link
            href={currentUser ? "/dashboard" : "/"}
            className="shrink-0 transition-opacity hover:opacity-90"
            aria-label="RakshaDoc AI home"
          >
            <Logo subtitle={false} />
          </Link>

          {/* Desktop Nav Links */}
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/5 bg-white/[0.03] px-2 py-1 lg:flex"
            aria-label="Main navigation"
          >
            {(currentUser ? appLinks : publicLinks).map((link) => {
              const active =
                link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide transition-all duration-300",
                    active
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] ring-1 ring-amber-500/40"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA / Profile */}
          <div className="hidden items-center gap-2.5 lg:flex">
            {!currentUser ? (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-1 pl-4 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-95"
                >
                  <span>Launch Engine</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/20 text-slate-950 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                </Link>
              </>
            ) : (
              <>
                {currentUser.role === "admin" && (
                  <Link
                    href="/dashboard/admin"
                    className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/20"
                  >
                    Admin Console
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pr-3 text-xs font-medium text-white transition-colors hover:bg-white/10 focus:outline-none">
                      <Avatar className="h-7 w-7 border border-white/20">
                        <AvatarFallback className="bg-amber-500/20 text-[11px] font-bold text-amber-300">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="max-w-[100px] truncate text-slate-200">
                        {currentUser.full_name?.split(" ")[0] || "User"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-2xl border border-white/10 bg-[#070b14]/95 p-1.5 backdrop-blur-2xl shadow-2xl"
                  >
                    <DropdownMenuLabel className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">
                          {currentUser.full_name}
                        </span>
                        <span className="text-[11px] font-normal text-slate-400 truncate">
                          {currentUser.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={() => {
                        logout();
                        router.push("/");
                      }}
                      className="cursor-pointer rounded-xl px-3 py-2 text-xs font-medium text-red-400 focus:bg-red-500/10 focus:text-red-300"
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Mobile Hamburger Morph Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {!currentUser ? (
              <Link
                href="/register"
                className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-md"
              >
                Launch
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white"
              >
                Console
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Expanded Overlay Menu */}
        {mobileOpen && (
          <div className="mt-2 flex flex-col gap-1.5 rounded-3xl border border-white/10 bg-[#070b14]/95 p-4 backdrop-blur-2xl lg:hidden animate-in fade-in-50 slide-in-from-top-4 duration-300">
            {(currentUser ? appLinks : publicLinks).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            {currentUser?.role === "admin" && (
              <Link
                href="/dashboard/admin"
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl px-4 py-2.5 text-sm font-medium text-amber-300 hover:bg-amber-500/10"
              >
                Admin Console
              </Link>
            )}
            <div className="mt-2 border-t border-white/10 pt-3">
              {currentUser ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                    router.push("/");
                  }}
                  className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex justify-center rounded-2xl border border-white/10 py-2.5 text-sm font-medium text-white hover:bg-white/5"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-semibold text-slate-950"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
