import AppLogo from "./AppLogo";
import { appsForFamily } from "@/lib/apps";
import type { ScoreResult } from "@/lib/types";

/* A green check / dim cross, sized for inline use. */
function Check({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "var(--grade-a)" }}>
      ✓
    </span>
  ) : (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line-strong text-[11px] font-bold text-faint">
      ✕
    </span>
  );
}

/**
 * Gamified progress: which tracked apps this wallet has touched (complete the
 * set), plus the concrete milestones that move the score. Turns the scoring
 * rubric into a checklist the owner can act on.
 */
export default function AppCoverage({ result, usedAppIds }: { result: ScoreResult; usedAppIds: string[] }) {
  const apps = appsForFamily(result.family);
  const usedIds = new Set(usedAppIds);
  const total = apps.length;
  const used = result.totals.appsUsed;
  const remaining = Math.max(0, 5 - used);

  const avgTicket = result.totals.txCount > 0 ? result.totals.volumeUsd / result.totals.txCount : 0;

  const milestones = [
    {
      label: "Active in 5+ apps",
      sub: "Unlocks the Full-Stack boost (+50)",
      done: used >= 5,
    },
    {
      label: "Identity verified",
      sub: result.kyc.verified ? "KYC attestation found (+50)" : "Link a KYC attestation for +50",
      done: result.kyc.verified,
    },
    {
      label: "Average transaction over $1,000",
      sub: `Currently $${Math.round(avgTicket).toLocaleString()} avg`,
      done: avgTicket >= 1000,
    },
    {
      label: "Two+ years on-chain",
      sub: `${(result.totals.walletAgeMonths / 12).toFixed(1)} years of history`,
      done: result.totals.walletAgeMonths >= 24,
    },
  ];

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight">App coverage</h2>
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground tabular-nums">{used}</span> / {total} tracked apps
          {remaining > 0 ? (
            <span className="text-faint"> · {remaining} more to unlock the Full-Stack boost</span>
          ) : used >= total ? (
            <span style={{ color: "var(--grade-a)" }}> · full coverage 🎉</span>
          ) : (
            <span style={{ color: "var(--grade-a)" }}> · Full-Stack boost earned ✓</span>
          )}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {apps.map((app) => {
          const on = usedIds.has(app.id);
          return (
            <div
              key={app.id}
              className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
              style={{
                borderColor: on ? "var(--grade-a)" : "var(--border)",
                background: on ? "var(--surface)" : "var(--surface-2)",
                opacity: on ? 1 : 0.7,
              }}
            >
              <div className={on ? "" : "grayscale"}>
                <AppLogo domain={app.domain} name={app.name} size={26} />
              </div>
              <span className="flex-1 text-sm font-medium truncate">{app.name}</span>
              <Check on={on} />
            </div>
          );
        })}
      </div>

      {/* Milestone boosts */}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {milestones.map((m) => (
          <div key={m.label} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <Check on={m.done} />
            <div className="min-w-0">
              <div className={`text-sm font-semibold ${m.done ? "" : "text-muted"}`}>{m.label}</div>
              <div className="text-xs text-faint">{m.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
