"use client";

import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setResult("");
    const res = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: form.get("url"), strategy: form.get("strategy") }),
    });
    setResult(JSON.stringify(await res.json(), null, 2));
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">PerfCoach</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label htmlFor="url">Website URL</label>
        <input id="url" name="url" required className="rounded border border-zinc-500 p-2" />
        <label htmlFor="strategy">Device</label>
        <select id="strategy" name="strategy" className="rounded border border-zinc-500 p-2">
          <option value="mobile">Mobile</option>
          <option value="desktop">Desktop</option>
        </select>
        <button disabled={loading} className="rounded bg-blue-700 p-2 text-white disabled:opacity-60">
          {loading ? "Auditing… this can take up to a minute" : "Run audit"}
        </button>
      </form>
      <pre aria-live="polite" className="mt-4 overflow-auto text-sm">{result}</pre>
    </main>
  );
}
