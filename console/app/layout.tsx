import type { Metadata } from "next";
import { Instrument_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const brandSans = Instrument_Sans({
  variable: "--font-brand-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["wdth"],
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Visa Risk Console",
  description: "Internal tool: configure the wallet risk model, monitor wallet portfolios, and tune outcomes.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${brandSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
