import type { Grade } from "@/lib/types";

const COLORS: Record<Grade, string> = {
  A: "var(--grade-a)",
  B: "var(--grade-b)",
  C: "var(--grade-c)",
};

export function gradeColor(grade: Grade): string {
  return COLORS[grade];
}

export default function GradeChip({
  grade,
  modifier = "",
  size = "md",
}: {
  grade: Grade;
  modifier?: string;
  size?: "md" | "lg";
}) {
  const dims = size === "lg" ? "h-16 w-16 text-3xl" : "h-8 w-8 text-sm";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl font-bold ${dims}`}
      style={{ color: COLORS[grade], border: `2px solid ${COLORS[grade]}`, background: "var(--surface-2)" }}
      aria-label={`Grade ${grade}${modifier}`}
    >
      {grade}
      {modifier}
    </span>
  );
}
