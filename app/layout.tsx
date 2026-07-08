import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://halbrook.vercel.app"),
  title: "Halbrook — Wallet Ratings",
  description:
    "Halbrook rates crypto wallets A, B, or C from real cross-app on-chain history. Look up any wallet, or plug the rating API into your app.",
  openGraph: {
    title: "Halbrook — The credit rating for wallets",
    description: "Live A/B/C wallet ratings from real on-chain history across Ethereum and Solana.",
    siteName: "Halbrook",
  },
  twitter: { card: "summary_large_image" },
};

const NAV = [
  { href: "/research", label: "Research" },
  { href: "/methodology", label: "Methodology" },
  { href: "/developers", label: "API" },
  { href: "/pricing", label: "Pricing" },
  { href: "/claim", label: "Claim" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <header className="border-b border-line sticky top-0 z-20 bg-surface/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-baseline gap-2.5 tracking-tight">
              <span className="font-bold text-lg">Halbrook</span>
              <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-faint">Wallet Ratings</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-muted">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-foreground transition-colors">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Analytics />
        <footer className="border-t border-line mt-16">
          <div className="mx-auto max-w-6xl px-5 py-8 text-xs text-faint">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/network" className="hover:text-muted">Network</Link>
              <Link href="/watchlist" className="hover:text-muted">Watchlist</Link>
              <Link href="/whitepaper" className="hover:text-muted">Whitepaper</Link>
              <Link href="/disputes" className="hover:text-muted">Disputes</Link>
              <Link href="/privacy" className="hover:text-muted">Privacy</Link>
              <Link href="/terms" className="hover:text-muted">Terms</Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 justify-between">
              <span>Halbrook — cross-app wallet ratings from live Ethereum and Solana mainnet data.</span>
              <span>Ratings are informational, not financial advice or a consumer credit report.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
