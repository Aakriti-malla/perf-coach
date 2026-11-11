import { z } from "zod";

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
