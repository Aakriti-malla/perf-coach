"use client";

import { useState } from "react";
import { UrlForm } from "@/components/UrlForm";
import { VitalsGrid } from "@/components/VitalsGrid";
import type { Strategy } from "@/lib/psi";
import type { AuditDigest } from "@/lib/schemas";

export default function Home() {
  const [digest, setDigest] = useState<AuditDigest | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runAudit(url: string, strategy: Strategy) {
    setLoading(true);
    setError("");
    setDigest(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, strategy }),
      });
      // Platform timeouts and gateway errors come back as HTML, not our JSON.
      const data = await res.json().catch(() => null);
      if (res.ok && data?.digest) {
        setDigest(data.digest);
      } else if (data?.error) {
        setError(data.error);
      } else if (res.status === 429) {
        setError("Too many requests. Please wait a bit and try again.");
      } else {
        setError("The audit timed out or failed. Please try again.");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">PerfCoach</h1>
      <UrlForm onSubmit={runAudit} loading={loading} />
      <div role="status" className="mt-4">
        {loading && "Auditing… this can take up to a minute"}
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}
      {digest && <VitalsGrid digest={digest} />}
    </main>
  );
}
