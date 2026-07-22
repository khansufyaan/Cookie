"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/",
    label: "Model",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
        <circle cx="16" cy="8" r="2.2" />
        <circle cx="7" cy="16" r="2.2" />
      </svg>
    ),
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    href: "/wallets",
    label: "Wallets",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="14" rx="3" />
        <path d="M2 10h20M16 15h2" />
      </svg>
    ),
  },
  {
    href: "/registry",
    label: "Registry",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v5H4zM4 15h16v5H4z" />
        <path d="M8 9v6" />
      </svg>
    ),
  },
  {
    href: "/integrations",
    label: "API stack",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 8l-5 4 5 4M16 8l5 4-5 4M13 5l-3 14" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  if (pathname === "/gate") return null;

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-line bg-surface px-4 py-5">
      <div className="px-2">
        <div className="flex items-baseline gap-2">
          <span className="visa-wordmark text-xl" style={{ color: "var(--accent-strong)" }}>VISA</span>
          <span className="font-semibold text-sm">Risk Console</span>
        </div>
        <span className="mt-1.5 inline-block rounded border border-line-strong px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-faint">
          Internal · Restricted
        </span>
      </div>

      <nav className="mt-8 space-y-1">
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground hover:bg-surface-2/60"
              }`}
              style={active ? { boxShadow: "inset 2px 0 0 var(--accent)" } : undefined}
            >
              <span className={active ? "text-accent-strong" : "text-faint"}>{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 text-[10px] leading-relaxed text-faint">
        <p>Model changes are session-local until published.</p>
        <p className="mt-2">Wallet Rating engine v0.4</p>
      </div>
    </aside>
  );
}
