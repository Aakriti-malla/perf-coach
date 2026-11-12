"use client";

import { useEffect, useState } from "react";

// The bar is an ESTIMATE: neither PSI nor the model reports real progress.
const CAP = 0.92; // never exceeds this until the request actually finishes
const AUDIT_TAU_MS = 12000; // audits typically take 15-25 s
const ANALYZE_TAU_MS = 3000; // analyses typically take 5-8 s
const SHOW_AFTER_MS = 300; // instant (cached) results never flash the bar
const HIDE_AFTER_MS = 300;
const TICK_MS = 200;

const COPY = {
  audit: { label: "Auditing", start: "Auditing, please wait", end: "Audit complete", tau: AUDIT_TAU_MS },
  analyze: { label: "Analyzing", start: "Analyzing, please wait", end: "Analysis complete", tau: ANALYZE_TAU_MS },
};

// Parents pass a new `key` for every run, so each run starts from fresh state.
export function ProgressBar({
  kind,
  state,
  signal = 0,
}: {
  kind: "audit" | "analyze";
  state: "idle" | "running" | "done" | "failed";
  signal?: number; // 0-1, only from real events (fully streamed recommendations)
}) {
  const { label, start, end, tau } = COPY[kind];
  const [shown, setShown] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [timeProgress, setTimeProgress] = useState(0);

  useEffect(() => {
    if (state === "running") {
      const startedAt = performance.now();
      const showTimer = setTimeout(() => setShown(true), SHOW_AFTER_MS);
      const tick = setInterval(() => {
        setTimeProgress(CAP * (1 - Math.exp(-(performance.now() - startedAt) / tau)));
      }, TICK_MS);
      return () => {
        clearTimeout(showTimer);
        clearInterval(tick);
      };
    }
    if (state === "done") {
      const hideTimer = setTimeout(() => setHidden(true), HIDE_AFTER_MS);
      return () => clearTimeout(hideTimer);
    }
  }, [state, tau]);

  // Failed runs hide immediately; their own message explains what happened.
  const visible = shown && (state === "running" || (state === "done" && !hidden));
  const reserve = state === "running" || (state === "done" && shown && !hidden);
  const message = !shown ? "" : state === "running" ? start : state === "done" ? end : "";
  const progress = state === "done" ? 1 : Math.min(CAP, Math.max(timeProgress, signal));

  return (
    <>
      <div role="status" className="sr-only">
        {message}
      </div>
      {/* Space is reserved for the whole run so the bar appearing doesn't shift the layout; it collapses once idle. */}
      <div aria-hidden="true" className={reserve ? `mt-4 h-9 ${visible ? "" : "invisible"}` : "hidden"}>
        <div className="mb-1 text-sm">{label}</div>
        <div className="h-2 overflow-hidden rounded-full border border-bark-soft bg-oat">
          <div
            className="h-full origin-left rounded-full bg-saddle transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>
    </>
  );
}
