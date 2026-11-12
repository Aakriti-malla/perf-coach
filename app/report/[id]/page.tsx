import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FixList } from "@/components/FixList";
import { VitalsGrid } from "@/components/VitalsGrid";
import { getRecs, getReport } from "@/lib/redis";
import { ReportId } from "@/lib/schemas";

export const metadata: Metadata = {
  title: "Performance report · PerfCoach",
  robots: { index: false, follow: false },
};

export default function ReportPage({ params }: PageProps<"/report/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Suspense fallback={<p role="status">Loading report…</p>}>
        <Report params={params} />
      </Suspense>
    </main>
  );
}

async function Report({ params }: { params: PageProps<"/report/[id]">["params"] }) {
  const parsed = ReportId.safeParse((await params).id);
  if (!parsed.success) notFound();
  const id = parsed.data;

  await connection();

  const [digest, recs] = await Promise.all([getReport(id), getRecs(id)]);

  return (
    <>
      {digest ? (
        <>
          <h1 className="text-3xl">Performance report</h1>
          <VitalsGrid digest={digest} />
          <FixList digest={digest} id={id} initial={recs ?? undefined} />
        </>
      ) : (
        <>
          <h1 className="text-3xl">Report not found</h1>
          <p className="mt-2">This report has expired or never existed. Reports are kept for 7 days.</p>
        </>
      )}
      <p className="mt-8">
        <Link href="/" className="text-bark underline underline-offset-2">
          {digest ? "Audit another page" : "Run a new audit"}
        </Link>
      </p>
    </>
  );
}
