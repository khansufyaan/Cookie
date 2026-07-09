import type { Grade } from "@/lib/types";

/* Grade accents bright enough to read on the deep-blue card face. */
const CARD_GRADE_COLORS: Record<Grade, string> = {
  A: "#5EE39A",
  B: "#FFC24B",
  C: "#FF8A7A",
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
 * Visa-blue face, grade + score, grouped wallet address. Server-safe: no
 * hooks. Sizes: md (default, hero/claim), sm (compact grids).
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
  grade: Grade;
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
      className={`grade-card relative w-full ${sm ? "max-w-[240px] rounded-xl" : "max-w-[360px] rounded-2xl"} aspect-[1.586/1] text-white select-none overflow-hidden ${className}`}
      aria-label={`Visa Wallet Rating pass: grade ${grade}${modifier}, score ${score} of 1000`}
    >
      <div className={`absolute inset-0 flex flex-col justify-between ${sm ? "p-3.5" : "p-5"}`}>
        {/* Top row: product name + grade */}
        <div className="flex items-start justify-between">
          <div>
            <div className={`font-semibold uppercase text-white/70 ${sm ? "text-[8px] tracking-[0.18em]" : "text-[10px] tracking-[0.24em]"}`}>
              Visa Wallet Rating
            </div>
            {!sm && (
              <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
                Living wallet pass
              </div>
            )}
          </div>
          <div className="flex flex-col items-end leading-none">
            <span className={`font-bold ${sm ? "text-[30px]" : "text-[42px]"}`} style={{ color: gradeColor }}>
              {grade}
              {modifier && <span className="align-super text-[0.45em]">{modifier}</span>}
            </span>
            <span className={`mt-1 font-semibold tracking-[0.14em] text-white/70 tabular-nums ${sm ? "text-[8px]" : "text-[10px]"}`}>
              {score} / 1000
            </span>
          </div>
        </div>

        {/* Middle: rated badge */}
        <div className="flex items-center">
          <span
            className={`rounded-full border font-semibold uppercase ${sm ? "px-1.5 py-0.5 text-[7px] tracking-[0.14em]" : "px-2 py-0.5 text-[9px] tracking-[0.16em]"}`}
            style={{ borderColor: gradeColor, color: gradeColor }}
          >
            Rated
          </span>
        </div>

        {/* Bottom: grouped address + holder + wordmark */}
        <div>
          <div className={`grade-card-pan font-mono tracking-[0.12em] text-white/95 whitespace-nowrap ${sm ? "text-[9px]" : "text-[13px] sm:text-sm"}`}>
            {panGroups(address)}
          </div>
          <div className={`flex items-end justify-between ${sm ? "mt-1" : "mt-2"}`}>
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
