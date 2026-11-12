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
        className="rounded-lg border border-bark-soft bg-paper p-2 text-bark placeholder:text-bark-soft"
      />
      <label htmlFor="strategy">Device</label>
      <select id="strategy" name="strategy" className="rounded-lg border border-bark-soft bg-paper p-2 text-bark">
        <option value="mobile">Mobile</option>
        <option value="desktop">Desktop</option>
      </select>
      <button
        disabled={loading}
        className="button"
      >
        {loading ? "Auditing…" : "Run audit"}
      </button>
    </form>
  );
}
