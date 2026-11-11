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

const RATINGS = {
  good: { label: "Good", style: "border-green-300 bg-green-50 text-green-800" },
  needs: { label: "Needs improvement", style: "border-amber-300 bg-amber-50 text-amber-800" },
  poor: { label: "Poor", style: "border-red-300 bg-red-50 text-red-800" },
  none: { label: "No data", style: "border-zinc-300 bg-zinc-50 text-zinc-700" },
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

function Tiles({ title, items }: { title: string; items: [string, Key, number | null][] }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map(([label, key, value]) => {
          const r = rate(key, value);
          return (
            <div key={key} className={`rounded border p-3 ${r.style}`}>
              <dt className="text-sm">{label}</dt>
              <dd className="text-2xl font-semibold">{format(key, value)}</dd>
              <dd className="text-sm">{r.label}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export function VitalsGrid({ digest }: { digest: AuditDigest }) {
  const { lab, field, scores } = digest;
  return (
    <div className="mt-8">
      <p className="break-all">
        <span className="font-semibold">{digest.url}</span> · {digest.strategy} ·{" "}
        <time dateTime={digest.fetchedAt}>
          {new Date(digest.fetchedAt).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })} (UTC)
        </time>
      </p>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
        {Object.entries({
          Performance: scores.performance,
          Accessibility: scores.accessibility,
          "Best practices": scores.bestPractices,
          SEO: scores.seo,
        }).map(([label, score]) => (
          <div key={label} className="flex gap-2">
            <dt>{label}</dt>
            <dd className="font-semibold">{score ?? "–"}</dd>
          </div>
        ))}
      </dl>
      <Tiles
        title="Lab data (Lighthouse)"
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
          items={[
            ["Largest Contentful Paint", "lcpMs", field.lcpMs],
            ["Interaction to Next Paint", "inpMs", field.inpMs],
            ["Cumulative Layout Shift", "cls", field.cls],
            ["First Contentful Paint", "fcpMs", field.fcpMs],
          ]}
        />
      ) : (
        <p className="mt-6">No field data is available for this URL; it doesn&apos;t have enough real-user traffic.</p>
      )}
    </div>
  );
}
