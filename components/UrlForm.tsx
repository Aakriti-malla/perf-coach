"use client";

import { ChevronDownIcon } from "@/components/icons";
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
      <div className="relative">
        <select
          id="strategy"
          name="strategy"
          className="w-full rounded-lg border border-bark-soft bg-paper p-2 pr-10 text-bark"
        >
          <option value="mobile">Mobile</option>
          <option value="desktop">Desktop</option>
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <ChevronDownIcon />
        </span>
      </div>
      <button
        disabled={loading}
        className="button"
      >
        {loading ? "Auditing…" : "Run audit"}
      </button>
    </form>
  );
}
