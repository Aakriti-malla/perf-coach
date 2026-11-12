import { z } from "zod";

export const ReportId = z.string().regex(/^[a-f0-9]{32}$/);

const nullableNumber = z.number().nullable();

export const AuditDigest = z.object({
  url: z.string(),
  strategy: z.enum(["mobile", "desktop"]),
  fetchedAt: z.string(),
  scores: z.object({
    performance: nullableNumber,
    accessibility: nullableNumber,
    bestPractices: nullableNumber,
    seo: nullableNumber,
  }),
  lab: z.object({
    lcpMs: nullableNumber,
    cls: nullableNumber,
    tbtMs: nullableNumber,
    fcpMs: nullableNumber,
    speedIndexMs: nullableNumber,
  }),
  // null when CrUX has no data for this URL
  field: z
    .object({
      lcpMs: nullableNumber,
      cls: nullableNumber,
      inpMs: nullableNumber,
      fcpMs: nullableNumber,
    })
    .nullable(),
  failingAudits: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        displayValue: z.string().nullable(),
        overallSavingsMs: z.number(),
      }),
    )
    .max(10),
});
export type AuditDigest = z.infer<typeof AuditDigest>;

export const Recommendation = z.object({
  title: z.string(),
  impact: z.enum(["high", "medium", "low"]),
  estimatedSavingsMs: z.number(),
  why: z.string(),
  howToFix: z.string(),
  relatedAuditId: z.string(),
});
export type Recommendation = z.infer<typeof Recommendation>;

// useObject needs an object at the top level, not a bare array.
export const Recommendations = z.object({ recommendations: z.array(Recommendation).max(8) });
export type Recommendations = z.infer<typeof Recommendations>;

// The model's ids and numbers are untrusted: the digest is the source of truth.
export function cleanRecommendations(recs: Recommendation[], digest: AuditDigest): Recommendation[] {
  const savings = new Map(digest.failingAudits.map((a) => [a.id, a.overallSavingsMs]));
  return recs
    .filter((r) => savings.has(r.relatedAuditId))
    .map((r) => {
      const ms = savings.get(r.relatedAuditId) ?? 0;
      return { ...r, estimatedSavingsMs: ms, impact: ms === 0 && r.impact === "high" ? "medium" : r.impact };
    })
    .sort((a, b) => b.estimatedSavingsMs - a.estimatedSavingsMs);
}
