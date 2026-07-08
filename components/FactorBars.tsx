import type { FactorScore } from "@/lib/types";

/** Horizontal factor-contribution bars (single amber hue; magnitude only). */
export default function FactorBars({ factors }: { factors: FactorScore[] }) {
  return (
    <div className="space-y-4">
      {factors.map((f) => {
        const max = f.weight * 1000;
        const pct = Math.max(1, (f.points / max) * 100);
        return (
          <div key={f.key}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">
                {f.label}
                <span className="ml-2 text-xs text-faint">{Math.round(f.weight * 100)}% weight</span>
              </span>
              <span className="tabular-nums text-muted">
                {f.points}<span className="text-faint"> / {max}</span>
              </span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-surface-2 border border-line overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: "var(--accent)" }}
              />
            </div>
            <p className="mt-1 text-xs text-faint">{f.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
