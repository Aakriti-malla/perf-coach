"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/ProgressBar";
import { UrlForm } from "@/components/UrlForm";
import type { Strategy } from "@/lib/psi";

export function AuditPanel() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "done" | "failed">("idle");
  const [run, setRun] = useState(0);

  async function runAudit(url: string, strategy: Strategy) {
    setRun((n) => n + 1);
    setStatus("running");
    setError("");
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, strategy }),
      });
      // Platform timeouts and gateway errors come back as HTML, not our JSON.
      const data = await res.json().catch(() => null);
      if (res.ok && data?.id) {
        // Stay disabled until the navigation completes.
        setStatus("done");
        router.push(`/report/${data.id}`);
        return;
      }
      if (data?.error) {
        setError(data.error);
      } else if (res.status === 429) {
        setError("Too many requests. Please wait a bit and try again.");
      } else {
        setError("The audit timed out or failed. Please try again.");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
    setStatus("failed");
  }

  return (
    <>
      <UrlForm onSubmit={runAudit} loading={status === "running" || status === "done"} />
      <ProgressBar key={run} kind="audit" state={status} />
      {error && (
        <p role="alert" className="mt-4 rounded-xl border-l-4 border-brick bg-linen p-3 text-bark">
          {error}
        </p>
      )}
    </>
  );
}
