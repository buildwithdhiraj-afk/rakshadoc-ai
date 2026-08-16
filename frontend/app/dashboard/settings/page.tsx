"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription className="text-xs">
            Your account information is shown below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium text-foreground">{user?.full_name}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium text-foreground">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant="secondary">{user?.role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-saffron/10 text-accent-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Demo Mode</h3>
              <Badge variant="demo">Active</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Until trained models are connected, all analysis is simulated and clearly labelled.
              Hash verification and Braille translation are real.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h3 className="text-sm font-semibold text-foreground">Data Retention</h3>
          <p className="text-sm text-muted-foreground">
            Documents are retained for a configurable period (default 90 days). You can permanently
            delete any owned document at any time from the Documents page.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Sign Out</h3>
            <p className="text-sm text-muted-foreground">
              Sign out of your current session.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardContent className="space-y-1 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Deleting documents is permanent and cannot be undone. Use the Delete action on any
            document in your Documents list when you no longer need it. Permanent deletions are
            confirmed with a dialog.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
