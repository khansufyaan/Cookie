import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cookie — Wallet Ratings",
  description:
    "Cookie rates crypto wallets A, B, or C from cross-app on-chain activity. Look up any wallet, or plug the rating API into your app.",
};

const NAV = [
  { href: "/network", label: "Network" },
  { href: "/methodology", label: "Methodology" },
  { href: "/developers", label: "API" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <header className="border-b border-line sticky top-0 z-20 bg-background/90 backdrop-blur">
          <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-lg">
              <span aria-hidden>🍪</span> Cookie
              <span className="ml-1 rounded-full border border-line-strong px-2 py-0.5 text-[10px] uppercase tracking-widest text-faint">
                demo
              </span>
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
        <footer className="border-t border-line mt-16">
          <div className="mx-auto max-w-6xl px-5 py-8 text-xs text-faint flex flex-wrap gap-x-6 gap-y-2 justify-between">
            <span>Cookie — cross-app wallet ratings. Ethereum lookups read live mainnet data; Solana and example profiles are demo tier.</span>
            <span>Ratings are informational, not financial advice or a consumer credit report.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
