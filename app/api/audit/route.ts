import { z } from "zod";
import { guardUrl } from "@/lib/url-guard";
import { fetchPsi, PsiError } from "@/lib/psi";
import { normalize } from "@/lib/normalize";
import { cacheKey, checkRateLimit, getReport, setReport } from "@/lib/redis";

export const maxDuration = 60;

const Body = z.object({
  url: z.string().min(1).max(2048),
  strategy: z.enum(["mobile", "desktop"]),
});

export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "Provide a URL and a strategy (mobile or desktop)." }, { status: 400 });
  }

  const guard = guardUrl(body.data.url);
  if (!guard.ok) return Response.json({ error: guard.error }, { status: 400 });

  const id = cacheKey(guard.url, body.data.strategy);
  const cached = await getReport(id);
  if (cached) return Response.json({ id, digest: cached });

  // Only real PSI calls count against the limit; cache hits are free.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const limit = await checkRateLimit("audit", ip);
  if (limit === "limited") {
    return Response.json({ error: "You've used your 5 audits for this hour. Try again later." }, { status: 429 });
  }
  if (limit === "error") {
    return Response.json({ error: "Audits are temporarily unavailable. Try again shortly." }, { status: 503 });
  }

  try {
    const digest = normalize(await fetchPsi(guard.url.href, body.data.strategy));
    if (!(await setReport(id, digest))) {
      return Response.json({ error: "Couldn't save the report. Please try again." }, { status: 503 });
    }
    return Response.json({ id, digest });
  } catch (e) {
    const message = e instanceof PsiError ? e.message : "Something went wrong running the audit.";
    return Response.json({ error: message }, { status: 502 });
  }
}
