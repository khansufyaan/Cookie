import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// Instrument Sans is the closest open typeface to Visa Dialect, the Visa
// brand face: humanist grotesque, open apertures, tall x-height.
const brandSans = Instrument_Sans({
  variable: "--font-brand-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["wdth"],
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://visa-wallet-rating.vercel.app"),
  title: "Visa Wallet Rating — a Visa Labs concept",
  description:
    "Visa Wallet Rating rates crypto wallets A, B, or C from real cross-app on-chain history. Look up any wallet, or plug the rating API into your app.",
  openGraph: {
    title: "Visa Wallet Rating — The credit rating for wallets",
    description: "Live A/B/C wallet ratings from real on-chain history across Ethereum and Solana.",
    siteName: "Visa Wallet Rating",
  },
  twitter: { card: "summary_large_image" },
};

// Audience-first: how it works · the strategy · the integration surface · mint.
// Pricing is merged into the developer journey (recap + link on /developers).
// Research tab hidden for now — page still lives at /research if we relink it.
const NAV = [
  { href: "/methodology", label: "How it works" },
  { href: "/why", label: "Why Visa" },
  { href: "/developers", label: "For developers" },
  { href: "/claim", label: "Mint" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${brandSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <header className="border-b border-line sticky top-0 z-20 bg-surface/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-baseline gap-2.5 tracking-tight">
              <span className="visa-wordmark text-xl" style={{ color: "var(--accent)" }}>VISA</span>
              <span className="font-semibold text-lg">Wallet Rating</span>
              <span className="hidden sm:inline rounded-full border border-line-strong px-2 py-0.5 text-[10px] uppercase tracking-widest text-faint">Visa Labs concept</span>
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
              <Link href="/why" className="hover:text-muted">Why Visa</Link>
              <Link href="/network" className="hover:text-muted">Network</Link>
              <Link href="/whitepaper" className="hover:text-muted">Whitepaper</Link>
              <Link href="/disputes" className="hover:text-muted">Disputes</Link>
              <Link href="/privacy" className="hover:text-muted">Privacy</Link>
              <Link href="/terms" className="hover:text-muted">Terms</Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 justify-between">
              <span>Visa Wallet Rating — cross-app wallet ratings from live Ethereum and Solana mainnet data.</span>
              <span>Ratings are informational, not financial advice or a consumer credit report.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
