import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { GaugeIcon, SearchIcon, WrenchIcon } from "@/components/icons";

const TITLE = "PerfCoach: find out why your page is slow";
const DESCRIPTION =
  "Run Google PageSpeed Insights on a URL, see its Core Web Vitals, and get fixes ranked by how much time they could save.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

const FEATURES = [
  {
    Icon: GaugeIcon,
    title: "Real measurements",
    text: "Lab data from Lighthouse, plus real-user data from Chrome's field dataset where it's available.",
  },
  {
    Icon: WrenchIcon,
    title: "Ranked fixes",
    text: "An AI model orders the failing audits by estimated time saved. Every fix is tied to a real failing audit.",
  },
  {
    Icon: SearchIcon,
    title: "Shareable reports",
    text: "Each audit gets its own link you can send to a teammate.",
  },
];

const STEPS = [
  "Paste a URL and pick mobile or desktop.",
  "We run the audit with PageSpeed Insights.",
  "Open your report and ask for AI-ranked fixes.",
];

export default function Home() {
  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <Hero />

        <section className="mt-16">
          <h2 className="text-2xl">What you get</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ Icon, title, text }) => (
              <li key={title} className="card">
                <Icon />
                <h3 className="mt-3 text-xl">{title}</h3>
                <p className="mt-2 text-sm">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl">How it works</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-bark">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <p className="mt-10 text-sm">
          Audits are limited to 5 per hour, and AI fixes can pause for the rest of the day when the free daily quota is
          used.
        </p>
      </main>

      <footer className="mx-auto w-full max-w-3xl border-t border-stone px-6 py-8 text-sm">
        <p>
          Built by Aakriti Malla ·{" "}
          <a href="https://github.com/aakriti-malla" rel="noopener noreferrer" className="text-bark underline underline-offset-2">
            GitHub
          </a>{" "}
          ·{" "}
          <a
            href="https://www.linkedin.com/in/aakriti-malla"
            rel="noopener noreferrer"
            className="text-bark underline underline-offset-2"
          >
            LinkedIn
          </a>
        </p>
        <p className="mt-2">Not affiliated with Google. Audit data comes from the PageSpeed Insights API.</p>
      </footer>
    </>
  );
}
