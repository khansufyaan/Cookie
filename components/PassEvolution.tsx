"use client";

import { useEffect, useState } from "react";
import type { Grade } from "@/lib/types";
import GradeCard from "./GradeCard";

/* One wallet's pass, replayed over time — the same pass upgrades itself as
   the wallet builds history. Illustrative numbers, consistent with the
   grade bands (A ≥ 800, B ≥ 450). */
const STAGES: {
  label: string;
  grade: Grade;
  modifier: string;
  score: number;
  note: string;
}[] = [
  { label: "Month 1", grade: "C", modifier: "", score: 290, note: "New wallet — first transactions land, the pass appears." },
  { label: "Month 6", grade: "B", modifier: "−", score: 490, note: "Six active months and a third tracked app: first upgrade." },
  { label: "Month 12", grade: "B", modifier: "+", score: 660, note: "A year of steady use — volume and reach keep compounding." },
  { label: "Year 2", grade: "A", modifier: "", score: 830, note: "Five apps, twenty-four months: the pass reaches the top band." },
];

const DEMO_ADDRESS = "0x3fd19a5e27b46c9861b4f77a3521bd12c8e04a76";
const INTERVAL_MS = 3200;

export default function PassEvolution() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAuto(false);
      return;
    }
  }, []);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setI((v) => (v + 1) % STAGES.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, [auto]);

  const stage = STAGES[i];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-72 sm:w-[340px] max-w-full">
        {/* Stack all stages; crossfade the active one. */}
        {STAGES.map((s, idx) => (
          <div
            key={s.label}
            className="transition-opacity duration-700"
            style={{
              opacity: idx === i ? 1 : 0,
              position: idx === 0 ? "relative" : "absolute",
              inset: 0,
            }}
            aria-hidden={idx !== i}
          >
            <GradeCard
              grade={s.grade}
              modifier={s.modifier}
              score={s.score}
              address={DEMO_ADDRESS}
              holder={s.label}
            />
          </div>
        ))}
      </div>

      {/* Timeline dots — also manual controls */}
      <div className="mt-5 flex items-center gap-2" role="tablist" aria-label="Pass over time">
        {STAGES.map((s, idx) => (
          <button
            key={s.label}
            role="tab"
            aria-selected={idx === i}
            aria-label={s.label}
            onClick={() => { setI(idx); setAuto(false); }}
            className="rounded-full px-3 py-1 text-[11px] font-semibold transition-colors"
            style={
              idx === i
                ? { background: "var(--accent)", color: "#fff" }
                : { background: "var(--surface-2)", color: "var(--faint)" }
            }
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted text-center max-w-xs min-h-[2.5rem]">{stage.note}</p>
    </div>
  );
}
