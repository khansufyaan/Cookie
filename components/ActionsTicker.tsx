"use client";

import { useEffect, useState } from "react";

interface Action {
  address: string;
  action: string;
  grade: string;
  score: number;
  delta: number | null;
}

const STYLE: Record<string, { color: string; symbol: string }> = {
  Upgrade: { color: "var(--grade-a)", symbol: "▲" },
  Downgrade: { color: "var(--grade-c)", symbol: "▼" },
  Affirmed: { color: "var(--muted)", symbol: "•" },
  "Coverage initiated": { color: "var(--accent)", symbol: "+" },
};

/** Single-line rotating feed of live rating actions. */
export default function ActionsTicker() {
  const [actions, setActions] = useState<Action[]>([]);
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetch("/api/v1/actions")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.data?.length && setActions(d.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (actions.length < 2) return;
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setI((x) => (x + 1) % actions.length);
        setVisible(true);
      }, 250);
    }, 4000);
    return () => clearInterval(t);
  }, [actions.length]);

  if (actions.length === 0) return null;
  const a = actions[i];
  const s = STYLE[a.action] ?? STYLE.Affirmed;

  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 h-9 flex items-center justify-center gap-3 text-xs">
        <span className="uppercase tracking-widest text-faint shrink-0">Rating actions</span>
        <span
          className="flex items-center gap-2 truncate transition-opacity duration-200 tabular-nums"
          style={{ opacity: visible ? 1 : 0 }}
        >
          <span className="font-semibold shrink-0" style={{ color: s.color }}>
            {s.symbol} {a.action}
          </span>
          <span className="font-mono text-faint">{a.address.slice(0, 8)}…{a.address.slice(-4)}</span>
          <span className="font-bold" style={{ color: `var(--grade-${a.grade[0].toLowerCase()})` }}>{a.grade}</span>
          <span className="font-medium">{a.score}</span>
          {a.delta !== null && a.delta !== 0 && (
            <span style={{ color: a.delta > 0 ? "var(--grade-a)" : "var(--grade-c)" }}>
              ({a.delta > 0 ? "+" : ""}{a.delta})
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
