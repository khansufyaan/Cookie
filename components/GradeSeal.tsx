import type { Grade } from "@/lib/types";
import { gradeColor } from "./GradeChip";

/**
 * Institutional rating seal — the bond-rating-stamp presentation of a grade.
 * Sizes: sm (inline), md (cards), lg (wallet report hero).
 */
export default function GradeSeal({
  grade,
  modifier = "",
  size = "md",
}: {
  grade: Grade;
  modifier?: string;
  size?: "sm" | "md" | "lg";
}) {
  const color = gradeColor(grade);
  const dims =
    size === "lg"
      ? { box: "h-40 w-40 rounded-2xl border-[3px]", letter: "text-7xl", micro: "text-[9px] tracking-[0.28em]" }
      : size === "md"
        ? { box: "h-24 w-24 rounded-xl border-2", letter: "text-4xl", micro: "text-[7px] tracking-[0.24em]" }
        : { box: "h-14 w-14 rounded-lg border-2", letter: "text-xl", micro: "text-[5px] tracking-[0.2em]" };

  return (
    <div
      className={`inline-flex flex-col items-center justify-center bg-surface select-none ${dims.box}`}
      style={{ borderColor: color, boxShadow: `0 1px 3px rgba(16,24,40,0.08)` }}
      aria-label={`Halbrook grade ${grade}${modifier}`}
    >
      <span className={`font-semibold uppercase ${dims.micro}`} style={{ color: "var(--faint)" }}>
        Halbrook
      </span>
      <span className={`font-bold leading-none my-0.5 ${dims.letter}`} style={{ color }}>
        {grade}
        {modifier && <span className="align-super" style={{ fontSize: "0.45em" }}>{modifier}</span>}
      </span>
      <span className={`font-semibold uppercase ${dims.micro}`} style={{ color: "var(--faint)" }}>
        Rated
      </span>
    </div>
  );
}
