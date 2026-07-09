import type { Grade } from "@/lib/types";

/* Grade accents bright enough to read on the deep-blue card face. */
const CARD_GRADE_COLORS: Record<Grade, string> = {
  A: "#5EE39A",
  B: "#FFC24B",
  C: "#FF8A7A",
};

/** Wallet address in embossed-PAN groups: 0xD8DA 6BF2 ···· 6045 */
function panGroups(address: string): string {
  const head = address.slice(0, 12);
  const tail = address.slice(-4);
  const groups = head.match(/.{1,4}/g) ?? [head];
  return `${groups.join(" ")} ···· ${tail}`;
}

function Chip() {
  return (
    <svg width="42" height="32" viewBox="0 0 42 32" aria-hidden>
      <defs>
        <linearGradient id="chip-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3D479" />
          <stop offset="0.5" stopColor="#D9A93F" />
          <stop offset="1" stopColor="#B9871E" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="40" height="30" rx="6" fill="url(#chip-gold)" stroke="rgba(0,0,0,0.25)" />
      <path
        d="M1 11h12M1 21h12M29 11h12M29 21h12M13 11v10M29 11v10M13 16h16"
        stroke="rgba(60,40,0,0.45)"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

/**
 * The credential as a physical card — the credit-card presentation of a
 * grade. ID-1 proportions, Visa-blue face, chip, embossed PAN-grouped
 * address. Server-safe: no hooks.
 */
export default function GradeCard({
  grade,
  modifier = "",
  score,
  address,
  tier,
  holder,
  className = "",
}: {
  grade: Grade;
  modifier?: string;
  score: number;
  address: string;
  tier?: string;
  /** Optional cardholder line (e.g. a persona name); defaults to the tier. */
  holder?: string;
  className?: string;
}) {
  const gradeColor = CARD_GRADE_COLORS[grade];
  return (
    <div
      className={`grade-card relative w-full max-w-[360px] aspect-[1.586/1] rounded-2xl text-white select-none overflow-hidden ${className}`}
      aria-label={`Visa Wallet Rating credential: grade ${grade}${modifier}, score ${score} of 1000`}
    >
      <div className="absolute inset-0 flex flex-col justify-between p-5">
        {/* Top row: product name + grade */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
              Visa Wallet Rating
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
              Living wallet pass
            </div>
          </div>
          <div className="flex flex-col items-end leading-none">
            <span className="text-[42px] font-bold" style={{ color: gradeColor }}>
              {grade}
              {modifier && <span className="align-super text-[0.45em]">{modifier}</span>}
            </span>
            <span className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-white/70 tabular-nums">
              {score} / 1000
            </span>
          </div>
        </div>

        {/* Middle: chip */}
        <div className="flex items-center gap-3">
          <Chip />
          <span
            className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]"
            style={{ borderColor: gradeColor, color: gradeColor }}
          >
            Rated
          </span>
        </div>

        {/* Bottom: embossed address + holder + wordmark */}
        <div>
          <div className="grade-card-pan font-mono text-[13px] sm:text-sm tracking-[0.12em] text-white/95 whitespace-nowrap">
            {panGroups(address)}
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">
              {holder ?? (tier ? `${tier} tier` : "Wallet owner")}
            </div>
            <span className="visa-wordmark text-xl leading-none text-white">VISA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
