"use client";

import { useState } from "react";
import { useObject } from "@ai-sdk/react";
import { cleanRecommendations, Recommendation, Recommendations, type AuditDigest } from "@/lib/schemas";

const IMPACT_STYLE = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-zinc-100 text-zinc-800",
};

const BUSY = "AI fixes are busy right now. Please try again in a minute.";

// Non-200 responses arrive as the raw JSON body in error.message; mid-stream failures have no body.
function errorMessage(error: Error): string {
  try {
    return JSON.parse(error.message).message ?? BUSY;
  } catch {
    return BUSY;
  }
}

export function FixList({ digest, id, initial }: { digest: AuditDigest; id: string; initial?: Recommendations }) {
  const [emptyFinish, setEmptyFinish] = useState(false);
  const { object, submit, isLoading, error } = useObject({
    api: "/api/analyze",
    schema: Recommendations,
    initialValue: initial,
    onFinish: ({ object }) => setEmptyFinish(!object?.recommendations.length),
  });

  const complete = (object?.recommendations ?? []).flatMap((r) => {
    const parsed = Recommendation.safeParse(r);
    return parsed.success ? [parsed.data] : [];
  });
  const fixes = cleanRecommendations(complete, digest);
  const message = error ? errorMessage(error) : emptyFinish && !isLoading ? BUSY : "";

  return (
    <section className="mt-8" aria-busy={isLoading}>
      <h2 className="mb-2 text-lg font-semibold">AI-ranked fixes</h2>
      {!isLoading && fixes.length === 0 && (
        <button
          onClick={() => {
            setEmptyFinish(false);
            submit({ id });
          }}
          className="rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
        >
          Get AI fixes
        </button>
      )}
      <div role="status" className="mt-2">
        {isLoading && "Analyzing the failing audits…"}
      </div>
      {message && (
        <p role="alert" className="mt-2 rounded border border-amber-300 bg-amber-50 p-3 text-amber-800">
          {message}
        </p>
      )}
      <ol className="mt-3 flex flex-col gap-4">
        {fixes.map((fix) => (
          <li key={fix.title} className="rounded border border-zinc-300 p-4">
            <h3 className="font-semibold">{fix.title}</h3>
            <p className="mt-1 text-sm">
              <span className={`rounded px-2 py-0.5 font-medium ${IMPACT_STYLE[fix.impact]}`}>
                {fix.impact} impact
              </span>{" "}
              · est. savings {fix.estimatedSavingsMs} ms · audit <code>{fix.relatedAuditId}</code>
            </p>
            <p className="mt-2">{fix.why}</p>
            <p className="mt-2">
              <span className="font-semibold">How to fix: </span>
              {fix.howToFix}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
