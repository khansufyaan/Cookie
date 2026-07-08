import type { Grade } from "@/lib/types";
import { gradeColor } from "./GradeChip";

/**
 * Institutional rating seal — the bond-rating-stamp presentation of a grade.
 * Fixed three-row layout so every seal has identical proportions regardless
 * of letter or modifier. Sizes: sm (inline), md (cards), lg (report hero).
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
      ? { box: "h-40 w-40 rounded-2xl border-[3px] py-4", letter: "text-6xl", micro: "text-[9px] tracking-[0.3em]" }
      : size === "md"
        ? { box: "h-28 w-28 rounded-xl border-2 py-3", letter: "text-5xl", micro: "text-[8px] tracking-[0.26em]" }
        : { box: "h-14 w-14 rounded-lg border-2 py-1.5", letter: "text-xl", micro: "text-[5px] tracking-[0.2em]" };

  return (
    <div
      className={`inline-flex flex-col items-center justify-between bg-surface select-none ${dims.box}`}
      style={{ borderColor: color, boxShadow: "0 1px 3px rgba(16,24,40,0.10), 0 8px 24px -12px rgba(16,24,40,0.12)" }}
      aria-label={`Visa Wallet Rating grade ${grade}${modifier}`}
    >
      <span className={`font-semibold uppercase leading-none ${dims.micro}`} style={{ color: "var(--faint)" }}>
        Visa
      </span>
      <span className={`font-bold leading-none ${dims.letter}`} style={{ color }}>
        {grade}
        {modifier && <span className="align-super" style={{ fontSize: "0.4em" }}>{modifier}</span>}
      </span>
      <span className={`font-semibold uppercase leading-none ${dims.micro}`} style={{ color: "var(--faint)" }}>
        Rated
      </span>
    </div>
  );
}
