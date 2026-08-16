"use client";

import Link from "next/link";
import {
  Accessibility,
  FileSearch,
  FolderOpen,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

const links = [
  { href: "/dashboard/analyze", label: "Analyze Document", icon: FileSearch },
  { href: "/dashboard/documents", label: "My Documents", icon: FolderOpen },
  { href: "/dashboard/verify", label: "Verification", icon: ShieldCheck },
  { href: "/dashboard/braille", label: "Braille Output", icon: Accessibility },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function ProfilePage() {
  const { user } = useAuth();

  const initials = (user?.full_name ?? user?.email ?? "G")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleBadge = () => {
    switch (user?.role) {
      case "admin":
        return <Badge variant="default">Admin</Badge>;
      case "guest":
        return <Badge variant="warning">Guest</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <Avatar className="h-20 w-20 text-xl">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">{user?.full_name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-2">{roleBadge()}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Links</CardTitle>
          <CardDescription className="text-xs">
            Jump to frequently used sections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.href}>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href={l.href}>
                    <l.icon className="h-4 w-4" /> {l.label}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
