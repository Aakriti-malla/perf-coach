const SIZE = 64;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Lighthouse category bands: 90-100 good, 50-89 needs improvement, 0-49 poor.
const SCORE_BANDS = [
  { min: 90, label: "Good", stroke: "stroke-moss" },
  { min: 50, label: "Needs improvement", stroke: "stroke-clay" },
  { min: 0, label: "Poor", stroke: "stroke-brick" },
];

export function scoreBand(score: number | null) {
  if (score === null) return { label: "No data", stroke: "" };
  return SCORE_BANDS.find((band) => score >= band.min) ?? SCORE_BANDS[2];
}

// The ring is decoration; the number and the status word beside it carry the meaning.
export function ScoreRing({ score }: { score: number | null }) {
  const { stroke } = scoreBand(score);
  return (
    <div className="relative size-16">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" className="absolute inset-0 -rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-stone/40" />
        {score !== null && score > 0 && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
            className={stroke}
          />
        )}
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[22px] font-semibold tabular-nums text-bark">
        {score ?? "–"}
      </span>
    </div>
  );
}
