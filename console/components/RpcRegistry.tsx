"use client";

import {
  JURISDICTION_META, RPC_PROVIDERS, WALLET_DEFAULTS, type Jurisdiction,
} from "@/lib/rpcs";

const ORDER: Jurisdiction[] = ["us", "non-us", "decentralized"];

export default function RpcRegistry() {
  const counts = ORDER.map((j) => ({ j, n: RPC_PROVIDERS.filter((p) => p.jurisdiction === j).length }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight">RPC jurisdictions</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-muted">
        The other geoblock vector. A US-domiciled RPC provider would be compelled to block US IPs at connection time.
        This is a routing &amp; exposure reference — not a per-wallet signal.
      </p>

      {/* The key caveat, up front */}
      <div className="mt-5 rounded-2xl border border-line-strong bg-surface px-5 py-4">
        <p className="text-sm font-semibold">Why this can&apos;t classify a wallet</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          RPC choice is never written on-chain, so you can&apos;t tell which RPC an address used from its history. RPC
          geoblocking is an <span className="text-foreground">IP-layer control the provider enforces in real time</span> —
          the on-chain US signal (exchange interactions, on the US-exposure tab) is the address-based counterpart.
        </p>
      </div>

      {/* Counts */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {counts.map(({ j, n }) => (
          <div key={j} className="rounded-xl border border-line bg-surface px-4 py-3">
            <div className="text-xl font-bold tabular-nums" style={{ color: JURISDICTION_META[j].color }}>{n}</div>
            <div className="mt-0.5 text-[11px] text-faint">{JURISDICTION_META[j].label}</div>
          </div>
        ))}
      </div>

      {/* Provider lists */}
      {ORDER.map((j) => (
        <section key={j} className="mt-6">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold" style={{ color: JURISDICTION_META[j].color }}>{JURISDICTION_META[j].label}</h2>
            <span className="text-xs text-faint">{JURISDICTION_META[j].blurb}</span>
          </div>
          <div className="mt-2 overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line bg-surface text-left text-[10px] uppercase tracking-wider text-faint">
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">HQ / jurisdiction</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {RPC_PROVIDERS.filter((p) => p.jurisdiction === j).map((p) => (
                  <tr key={p.name} className="border-b border-line last:border-0 bg-surface align-top">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        {p.name}
                        {p.confidence === "verify" && (
                          <span className="rounded bg-surface-2 px-1 py-0.5 text-[9px] uppercase tracking-wide text-faint" title="Jurisdiction should be legally verified">verify</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{p.role}</td>
                    <td className="px-3 py-2.5 text-muted">{p.hq}</td>
                    <td className="px-3 py-2.5 text-faint">{p.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* Wallet defaults — the practically important bit */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold">Where wallets point by default</h2>
        <p className="mt-0.5 text-xs text-faint">The endpoints most users actually hit — and where a US geoblock lands first.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {WALLET_DEFAULTS.map((w) => (
            <div key={w.wallet} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
              <div>
                <div className="text-sm font-semibold">{w.wallet}</div>
                <div className="text-xs text-faint">→ {w.defaultRpc}</div>
              </div>
              <span
                className="rounded px-2 py-0.5 text-[10px] font-semibold"
                style={{ color: JURISDICTION_META[w.jurisdiction].color, border: `1px solid ${JURISDICTION_META[w.jurisdiction].color}` }}
              >
                {JURISDICTION_META[w.jurisdiction].label}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-faint">
          Most defaults are US-domiciled, so a US RPC geoblock would immediately affect the majority of wallets on their
          out-of-the-box settings — even before a user does anything on-chain. Circumventing it means manually switching
          to a non-US or decentralized endpoint (a VPN alone won&apos;t help if the provider blocks by verified IP).
        </p>
      </section>

      <p className="mt-6 text-[11px] leading-relaxed text-faint">
        Jurisdictions are curated from public records; rows marked <span className="uppercase">verify</span> need legal
        confirmation before use in a control. Add or correct providers via the Registry tab&apos;s admin flow in a
        production build.
      </p>
    </div>
  );
}
