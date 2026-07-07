import type { Grade } from "@/lib/types";
import { gradeColor } from "./GradeChip";

/** Hero score dial: 0–1000 arc with the grade letter in the center. */
export default function ScoreRing({
  score,
  grade,
  modifier,
}: {
  score: number;
  grade: Grade;
  modifier: string;
}) {
  const r = 84;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0.02, score / 1000);
  const color = gradeColor(grade);
  return (
    <div className="relative h-56 w-56" role="img" aria-label={`Score ${score} of 1000, grade ${grade}${modifier}`}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${frac * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-bold" style={{ color }}>
          {grade}
          {modifier}
        </div>
        <div className="mt-1 text-lg text-foreground font-semibold tabular-nums">{score}</div>
        <div className="text-xs text-faint">of 1000</div>
      </div>
    </div>
  );
}
