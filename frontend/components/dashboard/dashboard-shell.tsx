"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Accessibility,
  Bell,
  ChevronRight,
  Cpu,
  FlaskConical,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navGroups = [
  {
    label: "Intelligence Workspace",
    items: [
      { href: "/dashboard", label: "Overview Console", icon: LayoutDashboard },
      { href: "/dashboard/analyze", label: "Analyze Document", icon: Cpu },
      { href: "/dashboard/documents", label: "Document Vault", icon: FolderOpen },
      { href: "/dashboard/verify", label: "Hash Verification", icon: ShieldCheck },
      { href: "/dashboard/braille", label: "Braille Bharati G1", icon: Accessibility },
    ],
  },
];

const bottomNav = [
  { href: "/dashboard", label: "Console", icon: LayoutDashboard },
  { href: "/dashboard/analyze", label: "Analyze", icon: Cpu },
  { href: "/dashboard/documents", label: "Vault", icon: FolderOpen },
  { href: "/dashboard/verify", label: "Verify", icon: ShieldCheck },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-6">
        <Link href="/" onClick={onNavigate} aria-label="RakshaDoc AI home" className="block px-2">
          <Logo />
        </Link>
        <nav className="space-y-6" aria-label="Dashboard navigation">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2.5 px-3 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-400">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-300",
                          active
                            ? "bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-semibold"
                            : "text-slate-400 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <item.icon className="h-4 w-4" strokeWidth={1.5} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {user?.role === "admin" && (
            <div>
              <p className="mb-2.5 px-3 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-400">
                Administration
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/dashboard/admin"
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-300",
                      pathname.startsWith("/dashboard/admin")
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <FlaskConical className="h-4 w-4" strokeWidth={1.5} />
                    Admin Console
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </nav>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 backdrop-blur-xl">
        <div className="flex items-center gap-2 font-medium text-white">
          <Badge variant="demo" className="text-[9px] px-2 py-0.5">
            Active Core
          </Badge>
          <span className="text-[11px] font-mono text-slate-300">FastAPI + OpenCV</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
          Document parsing, SHA-256 fingerprinting and redaction operate entirely in isolated memory paths.
        </p>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [initialized, loading, user, router, pathname]);

  if (loading || !initialized || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="w-full max-w-sm space-y-4 p-6">
          <Skeleton className="h-8 w-40 bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
        </div>
      </div>
    );
  }

  const initials = user.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "RD";

  // Context breadcrumb
  const getContextLabel = () => {
    if (pathname === "/dashboard") return "Overview Console";
    if (pathname.startsWith("/dashboard/analyze")) return "Document Analysis";
    if (pathname.startsWith("/dashboard/documents/")) return "Document Details";
    if (pathname.startsWith("/dashboard/documents")) return "Document Vault";
    if (pathname.startsWith("/dashboard/verify")) return "Verification Center";
    if (pathname.startsWith("/dashboard/braille")) return "Braille Accessibility";
    return "Workspace";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/documents?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#030712] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/[0.08] bg-[#050814]/90 p-4 backdrop-blur-2xl lg:block">
        <SidebarNav />
      </aside>

      <div className="flex min-h-screen w-full flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-white/[0.08] bg-[#030712]/80 px-4 backdrop-blur-2xl lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[290px] border-r border-white/10 bg-[#050814] p-4 text-white">
                <SheetHeader>
                  <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
                </SheetHeader>
                <div className="h-full pt-2">
                  <SidebarNav />
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
              <span className="font-semibold text-white">RakshaDoc</span>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="font-mono text-amber-400">{getContextLabel()}</span>
            </div>
          </div>

          {/* Quick Search */}
          <form onSubmit={handleSearch} className="relative hidden w-72 md:block">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="search"
              placeholder="Search document ID or SHA-256..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-full border-white/10 bg-white/[0.04] pl-9 text-xs text-white placeholder:text-slate-400 focus-visible:border-amber-500/50"
            />
          </form>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="relative rounded-full text-slate-400 hover:text-white">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl border border-white/10 bg-[#070b14]/95 p-2 backdrop-blur-2xl text-slate-200">
                <DropdownMenuLabel className="flex items-center justify-between text-xs px-2 py-1.5 font-mono">
                  <span>Security Audit Log</span>
                  <Badge variant="outline" className="text-[9px]">Live Sync</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <div className="space-y-1 p-1 text-xs">
                  <div className="flex flex-col gap-0.5 rounded-xl p-2 hover:bg-white/5 transition-colors">
                    <p className="font-semibold text-white">SHA-256 Fingerprint Logged</p>
                    <p className="text-slate-400 text-[11px]">Certificate hash integrity verified in memory.</p>
                  </div>
                  <div className="flex flex-col gap-0.5 rounded-xl p-2 hover:bg-white/5 transition-colors">
                    <p className="font-semibold text-white">Sensitive Area Flagged</p>
                    <p className="text-slate-400 text-[11px]">Signature contour confidence: 99.1%.</p>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pr-3 text-xs font-medium text-white transition-colors hover:bg-white/10 focus:outline-none">
                  <Avatar className="h-7 w-7 border border-white/20">
                    <AvatarFallback className="bg-amber-500/20 text-[11px] font-bold text-amber-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-xs font-medium text-slate-200 sm:inline-block">
                    {user.full_name || user.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-white/10 bg-[#070b14]/95 p-1.5 backdrop-blur-2xl text-slate-200">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-semibold text-white">{user.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <Badge variant="secondary" className="mt-1 w-fit text-[9px] capitalize">
                      Role: {user.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={logout} className="cursor-pointer rounded-xl px-3 py-2 text-xs font-medium text-red-400 focus:bg-red-500/10 focus:text-red-300">
                  <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-8">{children}</main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#070b14]/95 backdrop-blur-2xl lg:hidden"
          aria-label="Mobile bottom navigation"
        >
          <ul className="grid grid-cols-4">
            {bottomNav.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                      active ? "text-amber-400 font-bold" : "text-slate-400 hover:text-white",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

