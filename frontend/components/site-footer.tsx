import Link from "next/link";
import { Logo } from "@/components/logo";

const productLinks = [
  { href: "/features", label: "Features" },
  { href: "/security", label: "Security" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "About" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "AI Disclaimer" },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Secure and accessible AI-powered document intelligence for multilingual Indian
              documents.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Product</h3>
              <ul className="mt-3 space-y-2">
                {productLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Legal</h3>
              <ul className="mt-3 space-y-2">
                {legalLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            RakshaDoc AI provides AI-assisted document analysis, privacy protection and integrity
            verification. Tamper-risk results are probabilistic and are not legal proof of forgery
            or authenticity. Official or legal verification should be performed through the relevant
            authoritative institution.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            © 2026 RakshaDoc AI. Understand. Protect. Verify. Access.
          </p>
        </div>
      </div>
    </footer>
  );
}
