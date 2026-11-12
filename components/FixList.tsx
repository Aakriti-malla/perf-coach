"use client";

import { useState } from "react";
import { useObject } from "@ai-sdk/react";
import { ChevronDownIcon, LightbulbIcon, WrenchIcon } from "@/components/icons";
import { ProgressBar } from "@/components/ProgressBar";
import {
  cleanRecommendations,
  MAX_RECOMMENDATIONS,
  Recommendation,
  Recommendations,
  type AuditDigest,
} from "@/lib/schemas";

const IMPACT = {
  high: { dot: "bg-brick", border: "border-l-brick" },
  medium: { dot: "bg-clay", border: "border-l-clay" },
  low: { dot: "bg-bark-soft", border: "border-l-bark-soft" },
};

const CHIP = "inline-flex items-center gap-1.5 rounded-full bg-linen px-2.5 py-0.5 font-medium text-bark";

const OPEN_BY_DEFAULT = 3;

const BUSY = "AI fixes are busy right now. Please try again in a minute.";

// Non-200 responses arrive as the raw JSON body in error.message; mid-stream failures have no body.
function errorMessage(error: Error): string {
  try {
    return JSON.parse(error.message).message ?? BUSY;
  } catch {
    return BUSY;
  }
}

function savingsLabel(ms: number): string {
  if (ms >= 1000) return `Saves ~${(ms / 1000).toFixed(1)} s`;
  return ms > 0 ? `Saves ~${Math.round(ms)} ms` : "No direct time saving";
}

// Display only: blank lines split paragraphs and `backticks` become inline code.
function Prose({ text }: { text: string }) {
  return (
    <div className="mt-2 max-w-[65ch] space-y-3 text-base leading-[1.65]">
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i}>
          {paragraph.split(/(`[^`]+`)/).map((part, j) =>
            part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
              <code key={j} className="rounded bg-oat-deep px-1.5 py-0.5 font-mono text-[0.9em] text-bark">
                {part.slice(1, -1)}
              </code>
            ) : (
              part
            ),
          )}
        </p>
      ))}
    </div>
  );
}

function Section({ icon, label, text, divided }: { icon: React.ReactNode; label: string; text: string; divided?: boolean }) {
  return (
    <div className={divided ? "mt-4 border-t border-stone pt-4" : "mt-4"}>
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-bark-soft">
        {icon}
        {label}
      </p>
      <Prose text={text} />
    </div>
  );
}

export function FixList({ digest, id, initial }: { digest: AuditDigest; id: string; initial?: Recommendations }) {
  // idle -> started (click) -> ok | fail (set by the hook's callbacks, not guessed from isLoading)
  const [phase, setPhase] = useState<"idle" | "started" | "ok" | "fail">("idle");
  const [attempt, setAttempt] = useState(0);
  const { object, submit, isLoading, error } = useObject({
    api: "/api/analyze",
    schema: Recommendations,
    initialValue: initial,
    onFinish: ({ object }) => setPhase(object?.recommendations.length ? "ok" : "fail"),
    onError: () => setPhase("fail"),
  });

  const complete = (object?.recommendations ?? []).flatMap((r) => {
    const parsed = Recommendation.safeParse(r);
    return parsed.success ? [parsed.data] : [];
  });
  const fixes = cleanRecommendations(complete, digest);
  const message = error ? errorMessage(error) : phase === "fail" ? BUSY : "";

  // While streaming, the last array item may still be partial, so only earlier ones count as done.
  const received = object?.recommendations?.length ?? 0;
  const streamed = isLoading ? Math.max(0, received - 1) : received;
  const barState =
    isLoading || phase === "started" ? "running" : phase === "ok" ? "done" : phase === "fail" ? "failed" : "idle";

  // Counts only: the individual savings estimates overlap, so they are never added together.
  const count = (impact: Recommendation["impact"]) => fixes.filter((fix) => fix.impact === impact).length;

  return (
    <section className="mt-8" aria-busy={isLoading}>
      <h2 className="text-xl">AI-ranked fixes</h2>
      <p className="mb-3 text-sm">Ranked by estimated time saved.</p>
      {!isLoading && fixes.length === 0 && (
        <button
          onClick={() => {
            setAttempt((n) => n + 1);
            setPhase("started");
            submit({ id });
          }}
          className="button"
        >
          Get AI fixes
        </button>
      )}
      <ProgressBar key={attempt} kind="analyze" state={barState} signal={streamed / MAX_RECOMMENDATIONS} />
      {message && (
        <p role="alert" className="mt-2 rounded-xl border-l-4 border-clay bg-oat p-3 text-bark">
          {message}
        </p>
      )}
      {fixes.length > 0 && (
        <p className="text-sm font-medium tabular-nums text-bark">
          {fixes.length} {fixes.length === 1 ? "fix" : "fixes"} · {count("high")} high · {count("medium")} medium ·{" "}
          {count("low")} low
        </p>
      )}
      <ol className="mt-3 flex flex-col gap-4">
        {fixes.map((fix, i) => (
          // Cached cards (initial) render without the entrance animation; only streamed-in cards animate.
          <li
            key={fix.title}
            className={`rounded-2xl border-l-[3px] bg-oat p-4 text-bark sm:p-6 ${IMPACT[fix.impact].border} ${initial ? "" : "card-enter"}`}
          >
            <details open={i < OPEN_BY_DEFAULT} className="group">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 [&::-webkit-details-marker]:hidden">
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-linen text-sm font-semibold tabular-nums"
                >
                  {i + 1}
                </span>
                <h3 className="min-w-0 flex-1 basis-48 text-xl">{fix.title}</h3>
                <span className={`${CHIP} text-sm`}>
                  <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${IMPACT[fix.impact].dot}`} />
                  {fix.impact} impact
                </span>
                <span className={`${CHIP} text-sm tabular-nums`}>{savingsLabel(fix.estimatedSavingsMs)}</span>
                <span className="inline-flex transition-transform duration-300 ease-out group-open:rotate-180 motion-reduce:transition-none">
                  <ChevronDownIcon />
                </span>
              </summary>
              <div className="mt-3">
                <code className={`${CHIP} font-mono text-xs`}>{fix.relatedAuditId}</code>
                <Section icon={<LightbulbIcon size={16} />} label="Why it matters" text={fix.why} />
                <Section icon={<WrenchIcon size={16} />} label="How to fix" text={fix.howToFix} divided />
              </div>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
