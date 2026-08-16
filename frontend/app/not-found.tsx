import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <div className="rounded-full bg-muted p-4 text-muted-foreground">
              <FileQuestion className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
            <p className="text-sm text-muted-foreground">
              The page or document you are looking for does not exist or has been moved.
            </p>
            <Button asChild variant="saffron" className="mt-2">
              <Link href="/">
                <Home className="h-4 w-4" /> Return Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
