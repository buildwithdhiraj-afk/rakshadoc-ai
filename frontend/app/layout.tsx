import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RakshaDoc AI — Understand. Protect. Verify. Access.",
    template: "%s · RakshaDoc AI",
  },
  description:
    "RakshaDoc AI uses computer vision and deep learning to understand multilingual Indian documents, protect sensitive authentication elements, verify document integrity and make document content more accessible.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  keywords: [
    "document intelligence",
    "OCR",
    "multilingual documents",
    "signature protection",
    "document verification",
    "Braille accessibility",
    "RakshaDoc AI",
  ],
};

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${sora.variable} ${geistMono.variable} dark h-full antialiased selection:bg-amber-500/30 selection:text-amber-200`}
    >
      <body className="flex min-h-full flex-col bg-[#030712] text-slate-100 antialiased">
        <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))]"></div>
        <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_70%,rgba(56,189,248,0.05),rgba(255,255,255,0))]"></div>
        <div className="relative z-10 flex min-h-full flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
