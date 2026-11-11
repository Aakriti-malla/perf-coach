import { z } from "zod";
import { AuditDigest } from "./schemas";

const Audit = z.object({
  id: z.string(),
  title: z.string(),
  score: z.number().nullable(),
  scoreDisplayMode: z.string(),
  numericValue: z.number().optional(),
  displayValue: z.string().optional(),
  metricSavings: z.record(z.string(), z.number()).optional(),
  details: z.object({ overallSavingsMs: z.number().optional() }).optional(),
});

// Only the PSI fields we read; anything else in the huge response is ignored.
const Psi = z.object({
  lighthouseResult: z.object({
    finalUrl: z.string(),
    fetchTime: z.string(),
    configSettings: z.object({ formFactor: z.enum(["mobile", "desktop"]) }),
    categories: z.record(z.string(), z.object({ score: z.number().nullable() })),
    audits: z.record(z.string(), Audit),
  }),
  loadingExperience: z
    .object({ metrics: z.record(z.string(), z.object({ percentile: z.number() })).optional() })
    .optional(),
});

const pct = (score: number | null | undefined) => (score == null ? null : Math.round(score * 100));

// CLS savings are a unitless score, so only the ms-based metrics count as time saved.
function savingsMs(a: z.infer<typeof Audit>): number {
  if (a.details?.overallSavingsMs != null) return a.details.overallSavingsMs;
  const ms = Object.entries(a.metricSavings ?? {}).filter(([k]) => k !== "CLS").map(([, v]) => v);
  return Math.max(0, ...ms);
}

export function normalize(raw: unknown): AuditDigest {
  const { lighthouseResult: lh, loadingExperience } = Psi.parse(raw);
  const value = (id: string) => lh.audits[id]?.numericValue ?? null;
  const metrics = loadingExperience?.metrics;
  const field = (key: string) => metrics?.[key]?.percentile ?? null;

  const failingAudits = Object.values(lh.audits)
    // numeric audits are the metrics themselves, not fixable items
    .filter((a) => a.score !== null && a.score < 0.9 && ["binary", "metricSavings"].includes(a.scoreDisplayMode))
    .map((a) => ({
      id: a.id,
      title: a.title,
      displayValue: a.displayValue ?? null,
      overallSavingsMs: Math.round(savingsMs(a)),
      score: a.score ?? 0,
    }))
    .sort((x, y) => y.overallSavingsMs - x.overallSavingsMs || x.score - y.score)
    .slice(0, 10)
    .map(({ id, title, displayValue, overallSavingsMs }) => ({ id, title, displayValue, overallSavingsMs }));

  return AuditDigest.parse({
    url: lh.finalUrl,
    strategy: lh.configSettings.formFactor,
    fetchedAt: lh.fetchTime,
    scores: {
      performance: pct(lh.categories.performance?.score),
      accessibility: pct(lh.categories.accessibility?.score),
      bestPractices: pct(lh.categories["best-practices"]?.score),
      seo: pct(lh.categories.seo?.score),
    },
    lab: {
      lcpMs: value("largest-contentful-paint"),
      cls: value("cumulative-layout-shift"),
      tbtMs: value("total-blocking-time"),
      fcpMs: value("first-contentful-paint"),
      speedIndexMs: value("speed-index"),
    },
    field: metrics
      ? {
          lcpMs: field("LARGEST_CONTENTFUL_PAINT_MS"),
          // CrUX reports CLS multiplied by 100
          cls: field("CUMULATIVE_LAYOUT_SHIFT_SCORE") === null ? null : field("CUMULATIVE_LAYOUT_SHIFT_SCORE")! / 100,
          inpMs: field("INTERACTION_TO_NEXT_PAINT"),
          fcpMs: field("FIRST_CONTENTFUL_PAINT_MS"),
        }
      : null,
    failingAudits,
  });
}
