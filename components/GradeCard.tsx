import type { Grade } from "@/lib/types";

/** Grades the card can display: real grades plus F, the sanctioned strike. */
export type CardGrade = Grade | "F";

/* Grade accents bright enough to read on the deep-blue card face. */
const CARD_GRADE_COLORS: Record<CardGrade, string> = {
  A: "#ffffff", // white pops on the gold face
  B: "#FFC24B",
  C: "#FF8A7A",
  F: "#FF4D4D",
};

/* Face treatment by grade — Visa tier language: gold A, black F, blue rest. */
const CARD_FACE: Record<CardGrade, string> = {
  A: "grade-card-gold",
  B: "grade-card",
  C: "grade-card",
  F: "grade-card-black",
};

/** Wallet address in grouped form: 0xD8DA 6BF2 ···· 6045 */
function panGroups(address: string): string {
  const head = address.slice(0, 12);
  const tail = address.slice(-4);
  const groups = head.match(/.{1,4}/g) ?? [head];
  return `${groups.join(" ")} ···· ${tail}`;
}

/**
 * The pass — the rating rendered as a wallet pass in card proportions:
 * Visa-blue face, grade + score, grouped wallet address, holder line, VISA
 * wordmark. Deliberately minimal. Server-safe: no hooks.
 * Sizes: md (default, hero/claim), sm (compact grids).
 */
export default function GradeCard({
  grade,
  modifier = "",
  score,
  address,
  tier,
  holder,
  size = "md",
  className = "",
}: {
  grade: CardGrade;
  modifier?: string;
  score: number;
  address: string;
  tier?: string;
  /** Optional holder line (e.g. a persona name); defaults to the tier. */
  holder?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const gradeColor = CARD_GRADE_COLORS[grade];
  const sm = size === "sm";
  return (
    <div
      className={`${CARD_FACE[grade]} relative w-full ${sm ? "max-w-[240px] rounded-xl" : "max-w-[360px] rounded-2xl"} aspect-[1.586/1] text-white select-none overflow-hidden ${className}`}
      aria-label={`Visa Wallet Rating pass: grade ${grade}${modifier}, score ${score} of 1000`}
    >
      <div className={`absolute inset-0 flex flex-col justify-between ${sm ? "p-3.5" : "p-5"}`}>
        {/* Top row: brand + grade */}
        <div className="flex items-start justify-between">
          <div className={`font-semibold uppercase text-white/75 whitespace-nowrap ${sm ? "text-[7px] tracking-[0.14em]" : "text-[10px] tracking-[0.24em]"}`}>
            Visa Wallet Rating
          </div>
          <div className="flex flex-col items-end leading-none">
            <span className={`font-bold ${sm ? "text-[30px]" : "text-[46px]"}`} style={{ color: gradeColor }}>
              {grade}
              {modifier && <span className="align-super text-[0.45em]">{modifier}</span>}
            </span>
            <span className={`mt-1 font-semibold tracking-[0.14em] text-white/70 tabular-nums whitespace-nowrap ${sm ? "text-[8px]" : "text-[11px]"}`}>
              {score} / 1000
            </span>
          </div>
        </div>

        {/* Bottom: grouped address + holder + wordmark */}
        <div>
          <div className={`grade-card-pan font-mono tracking-[0.12em] text-white/95 whitespace-nowrap ${sm ? "text-[9px]" : "text-[13px] sm:text-sm"}`}>
            {panGroups(address)}
          </div>
          <div className={`flex items-end justify-between ${sm ? "mt-1" : "mt-2.5"}`}>
            <div className={`font-medium uppercase text-white/60 ${sm ? "text-[7px] tracking-[0.14em]" : "text-[10px] tracking-[0.18em]"}`}>
              {holder ?? (tier ? `${tier} tier` : "Wallet owner")}
            </div>
            <span className={`visa-wordmark leading-none text-white ${sm ? "text-sm" : "text-xl"}`}>VISA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
