import { GaugeIcon, InfoIcon, PersonCircleIcon, SearchIcon, ShieldCheckIcon } from "@/components/icons";
import { ScoreRing, scoreBand } from "@/components/ScoreRing";
import type { AuditDigest } from "@/lib/schemas";

// [good upper bound, poor lower bound] from web.dev/vitals and Lighthouse scoring
const THRESHOLDS = {
  lcpMs: [2500, 4000],
  cls: [0.1, 0.25],
  inpMs: [200, 500],
  fcpMs: [1800, 3000],
  tbtMs: [200, 600],
  speedIndexMs: [3400, 5800],
} as const;

type Key = keyof typeof THRESHOLDS;

const ABBREVIATIONS: Record<Key, string> = {
  lcpMs: "LCP",
  cls: "CLS",
  inpMs: "INP",
  fcpMs: "FCP",
  tbtMs: "TBT",
  speedIndexMs: "SI",
};

const RATINGS = {
  good: { label: "Good", border: "border-l-moss", dot: "bg-moss" },
  needs: { label: "Needs improvement", border: "border-l-clay", dot: "bg-clay" },
  poor: { label: "Poor", border: "border-l-brick", dot: "bg-brick" },
  none: { label: "No data", border: "border-l-bark-soft", dot: "bg-bark-soft" },
};

function rate(key: Key, value: number | null) {
  if (value === null) return RATINGS.none;
  const [good, poor] = THRESHOLDS[key];
  return value <= good ? RATINGS.good : value <= poor ? RATINGS.needs : RATINGS.poor;
}

function format(key: Key, value: number | null): string {
  if (value === null) return "–";
  if (key === "cls") return value.toFixed(2);
  if (key === "tbtMs" || key === "inpMs") return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(1)} s`;
}

// Each rating band gets a third of the scale, however wide it is numerically; values past "poor" are clamped.
function markerPercent(key: Key, value: number): number {
  const [good, poor] = THRESHOLDS[key];
  const thirds =
    value <= good ? value / good : value <= poor ? 1 + (value - good) / (poor - good) : 2 + Math.min(1, (value - poor) / poor);
  return Math.min(1, Math.max(0, thirds / 3)) * 100;
}

function Tiles({ title, caption, items }: { title: string; caption: string; items: [string, Key, number | null][] }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl">{title}</h2>
      <p className="mb-3 text-sm">{caption}</p>
      <dl className="grid grid-cols-1 gap-3 md:grid-cols-6">
        {items.map(([label, key, value], i) => {
          const r = rate(key, value);
          // 5 tiles fill a 6-column grid as 2+2+2 then 3+3; 4 tiles make two rows of 3+3.
          const span = items.length === 5 && i < 3 ? "md:col-span-2" : "md:col-span-3";
          return (
            <div key={key} className={`rounded-2xl border-l-4 bg-oat p-3 text-bark ${r.border} ${span}`}>
              <dt className="flex flex-wrap items-center gap-2 text-sm">
                {label}
                <span className="rounded-full bg-linen px-2 py-0.5 text-xs font-medium">{ABBREVIATIONS[key]}</span>
              </dt>
              <dd className="text-2xl font-semibold tabular-nums">{format(key, value)}</dd>
              {value !== null && (
                <dd aria-hidden="true" className="relative my-2 flex h-1.5 gap-0.5">
                  <span className="h-full flex-1 rounded-l-full bg-moss" />
                  <span className="h-full flex-1 bg-clay" />
                  <span className="h-full flex-1 rounded-r-full bg-brick" />
                  <span
                    className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bark ring-1 ring-oat"
                    style={{ left: `${markerPercent(key, value)}%` }}
                  />
                </dd>
              )}
              <dd className="flex items-center gap-2 text-sm">
                <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${r.dot}`} />
                {r.label}
              </dd>
              <dd className="mt-1 text-xs tabular-nums">Good ≤ {format(key, THRESHOLDS[key][0])}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export function VitalsGrid({ digest }: { digest: AuditDigest }) {
  const { lab, field, scores } = digest;
  const categories: [string, (props: { size?: number }) => React.JSX.Element, number | null][] = [
    ["Performance", GaugeIcon, scores.performance],
    ["Accessibility", PersonCircleIcon, scores.accessibility],
    ["Best practices", ShieldCheckIcon, scores.bestPractices],
    ["SEO", SearchIcon, scores.seo],
  ];
  return (
    <div className="mt-8">
      <p className="break-all">
        <span className="font-semibold">{digest.url}</span> · {digest.strategy} ·{" "}
        <time dateTime={digest.fetchedAt}>
          {new Date(digest.fetchedAt).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })} (UTC)
        </time>
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {categories.map(([label, Icon, score]) => (
          <div key={label} className="flex flex-col items-center gap-2 rounded-2xl bg-oat p-4 text-center text-bark">
            <dt className="flex items-center gap-2 text-sm">
              <Icon />
              {label}
            </dt>
            <dd className="order-first">
              <ScoreRing score={score} />
            </dd>
            <dd className="text-sm">{scoreBand(score).label}</dd>
          </div>
        ))}
      </dl>
      <Tiles
        title="Lab data (Lighthouse)"
        caption="A single simulated Lighthouse run."
        items={[
          ["Largest Contentful Paint", "lcpMs", lab.lcpMs],
          ["Cumulative Layout Shift", "cls", lab.cls],
          ["Total Blocking Time", "tbtMs", lab.tbtMs],
          ["First Contentful Paint", "fcpMs", lab.fcpMs],
          ["Speed Index", "speedIndexMs", lab.speedIndexMs],
        ]}
      />
      {field ? (
        <Tiles
          title="Field data (real users, CrUX)"
          caption="Real Chrome users."
          items={[
            ["Largest Contentful Paint", "lcpMs", field.lcpMs],
            ["Interaction to Next Paint", "inpMs", field.inpMs],
            ["Cumulative Layout Shift", "cls", field.cls],
            ["First Contentful Paint", "fcpMs", field.fcpMs],
          ]}
        />
      ) : (
        <p className="mt-6 flex items-start gap-2 rounded-xl border-l-4 border-clay bg-oat p-3 text-bark">
          <InfoIcon />
          No field data is available for this URL; it doesn&apos;t have enough real-user traffic.
        </p>
      )}
    </div>
  );
}
