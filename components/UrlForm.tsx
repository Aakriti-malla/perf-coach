"use client";

import type { Strategy } from "@/lib/psi";

export function UrlForm({
  onSubmit,
  loading,
}: {
  onSubmit: (url: string, strategy: Strategy) => void;
  loading: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        onSubmit(String(form.get("url")), form.get("strategy") as Strategy);
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor="url">Website URL</label>
      <input
        id="url"
        name="url"
        required
        placeholder="https://example.com"
        className="rounded border border-zinc-500 p-2"
      />
      <label htmlFor="strategy">Device</label>
      <select id="strategy" name="strategy" className="rounded border border-zinc-500 p-2">
        <option value="mobile">Mobile</option>
        <option value="desktop">Desktop</option>
      </select>
      <button
        disabled={loading}
        className="rounded bg-blue-700 p-2 text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Auditing…" : "Run audit"}
      </button>
    </form>
  );
}
