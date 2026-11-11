export type Strategy = "mobile" | "desktop";

export class PsiError extends Error {}

const ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export async function fetchPsi(url: string, strategy: Strategy): Promise<unknown> {
  const key = process.env.PSI_API_KEY;
  if (!key) throw new PsiError("The server is missing its PageSpeed API key.");

  const params = new URLSearchParams({ url, strategy, key });
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) {
    params.append("category", c);
  }

  let res: Response;
  try {
    // 55s keeps us under the route's 60s maxDuration so we can still reply.
    res = await fetch(`${ENDPOINT}?${params}`, { signal: AbortSignal.timeout(55_000) });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new PsiError("The audit took too long. The site may be slow or blocking Google. Try again.");
    }
    throw new PsiError("Couldn't reach the PageSpeed service. Try again shortly.");
  }

  if (res.ok) return res.json();
  if (res.status === 429) throw new PsiError("PageSpeed quota reached. Try again later.");
  if (res.status === 400) throw new PsiError("Google couldn't load that page. Check the URL is public and correct.");
  throw new PsiError("The PageSpeed service returned an error. Try again shortly.");
}
