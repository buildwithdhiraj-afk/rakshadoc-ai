import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
  themeColor: "#0d2b52",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
