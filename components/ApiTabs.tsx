"use client";

import { useState, type ReactNode } from "react";

/**
 * The two prices are the two tabs: pick FREE (report + read) or PAID
 * (read only) and see only that side's docs below — no more one long page.
 */
export default function ApiTabs({ free, paid }: { free: ReactNode; paid: ReactNode }) {
  const [tab, setTab] = useState<"free" | "paid">("free");

  return (
    <div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* FREE — first */}
        <button
          onClick={() => setTab("free")}
          className="rounded-2xl border-2 bg-surface p-6 text-left transition-colors"
          style={{ borderColor: tab === "free" ? "var(--accent)" : "var(--border)" }}
          aria-pressed={tab === "free"}
        >
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-accent">Report + read</div>
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Best value</span>
          </div>
          <div className="mt-1 text-2xl font-bold" style={{ color: "var(--accent)" }}>Free</div>
          <p className="mt-3 text-sm text-muted">
            Report off-chain data on wallets that use your app — the whole service is free.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-accent">
            {tab === "free" ? "▾ Showing the report API" : "See the report API"}
          </span>
        </button>
        {/* PAID */}
        <button
          onClick={() => setTab("paid")}
          className="rounded-2xl border-2 bg-surface p-6 text-left transition-colors"
          style={{ borderColor: tab === "paid" ? "var(--accent)" : "var(--border)" }}
          aria-pressed={tab === "paid"}
        >
          <div className="text-xs font-semibold uppercase tracking-widest text-faint">Read only</div>
          <div className="mt-1 text-2xl font-bold">Paid</div>
          <p className="mt-3 text-sm text-muted">
            Look up wallet ratings. Usage-based, from the first call.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-accent">
            {tab === "paid" ? "▾ Showing the read API" : "See the read API"}
          </span>
        </button>
      </div>

      <div className="mt-4">{tab === "free" ? free : paid}</div>
    </div>
  );
}
