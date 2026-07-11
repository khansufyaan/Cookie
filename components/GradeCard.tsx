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
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const gradeColor = CARD_GRADE_COLORS[grade];
  const s =
    size === "sm"
      ? {
          shell: "max-w-[240px] rounded-xl", pad: "p-3.5", brand: "text-[7px] tracking-[0.14em]",
          grade: "text-[30px]", score: "text-[8px]", pan: "text-[9px]", holder: "text-[7px] tracking-[0.14em]",
          mark: "text-sm", gapPan: "mt-1",
        }
      : size === "lg"
        ? {
            shell: "max-w-[640px] rounded-[28px]", pad: "p-8 sm:p-10", brand: "text-sm sm:text-base tracking-[0.28em]",
            grade: "text-[84px] sm:text-[104px]", score: "text-base sm:text-lg", pan: "text-xl sm:text-3xl",
            holder: "text-sm sm:text-base tracking-[0.2em]", mark: "text-3xl sm:text-4xl", gapPan: "mt-4",
          }
        : {
            shell: "max-w-[360px] rounded-2xl", pad: "p-5", brand: "text-[10px] tracking-[0.24em]",
            grade: "text-[46px]", score: "text-[11px]", pan: "text-[13px] sm:text-sm",
            holder: "text-[10px] tracking-[0.18em]", mark: "text-xl", gapPan: "mt-2.5",
          };
  return (
    <div
      className={`${CARD_FACE[grade]} relative w-full ${s.shell} aspect-[1.586/1] text-white select-none overflow-hidden ${className}`}
      aria-label={`Visa Wallet Rating pass: grade ${grade}${modifier}, score ${score} of 1000`}
    >
      <div className={`absolute inset-0 flex flex-col justify-between ${s.pad}`}>
        {/* Top row: brand + grade */}
        <div className="flex items-start justify-between">
          <div className={`font-semibold uppercase text-white/75 whitespace-nowrap ${s.brand}`}>
            Visa Wallet Rating
          </div>
          <div className="flex flex-col items-end leading-none">
            <span className={`font-bold ${s.grade}`} style={{ color: gradeColor }}>
              {grade}
              {modifier && <span className="align-super text-[0.45em]">{modifier}</span>}
            </span>
            <span className={`mt-1 font-semibold tracking-[0.14em] text-white/70 tabular-nums whitespace-nowrap ${s.score}`}>
              {score} / 1000
            </span>
          </div>
        </div>

        {/* Bottom: grouped address + holder + wordmark */}
        <div>
          <div className={`grade-card-pan font-mono tracking-[0.12em] text-white/95 whitespace-nowrap ${s.pan}`}>
            {panGroups(address)}
          </div>
          <div className={`flex items-end justify-between ${s.gapPan}`}>
            <div className={`font-medium uppercase text-white/60 ${s.holder}`}>
              {holder ?? (tier ? `${tier} tier` : "Wallet owner")}
            </div>
            <span className={`visa-wordmark leading-none text-white ${s.mark}`}>VISA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
