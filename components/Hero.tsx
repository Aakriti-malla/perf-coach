import { AuditPanel } from "@/components/AuditPanel";

export function Hero() {
  return (
    <section>
      <h1 className="max-w-[20ch] text-4xl leading-tight sm:text-5xl">
        Find out why your page is slow, and what to fix first.
      </h1>
      <p className="mt-4 max-w-[60ch] text-lg">
        Paste a URL. PerfCoach runs Google PageSpeed Insights, shows your Core Web Vitals, and ranks the fixes by how
        much time they could save.
      </p>
      <div className="card mt-8">
        <AuditPanel />
      </div>
      <p className="mt-3 text-sm">Free to use · No sign-up · Shareable reports kept for 7 days</p>
    </section>
  );
}
