# PerfCoach

Paste a URL, pick mobile or desktop, and get Core Web Vitals plus an AI-ranked list of fixes grounded in the failing Lighthouse audits. Every audit has a shareable link at `/report/[id]`.

- **Live demo:** _link coming soon_
- **Demo GIF:** _coming soon_

## How it works

1. The browser posts a URL and a device type to `/api/audit`.
2. The server validates the URL (`lib/url-guard.ts`), rate limits, and checks the Redis cache. On a miss it calls the Google PageSpeed Insights (PSI) API.
3. `lib/normalize.ts` reduces the PSI response (hundreds of KB) to a small digest: category scores, lab metrics, field metrics if available, and the top 10 failing audits. Only the digest is stored, sent to the client, or given to the model.
4. The browser navigates to `/report/[id]`, a server component that reads the digest from Redis and shows the vitals.
5. "Get AI fixes" posts only the report id to `/api/analyze`. The server loads the digest itself, streams structured recommendations from Gemini, validates them against the digest, and caches them with the report.

## Architecture decisions

- **Digest, not raw PSI.** Smaller payloads, lower token cost, and nothing user-controlled reaches the model beyond Lighthouse's own audit text. The digest is validated with Zod on the way in and on the way out of the cache.
- **Cache key = hash of normalized URL + device + UTC date.** A new day means a fresh audit with no invalidation logic. Reports live 7 days so shared links keep working.
- **The analyze route accepts only an id.** The client can never supply the text that the model analyzes.
- **Model output is untrusted.** Every recommendation's `relatedAuditId` must exist in the digest or it is dropped, and `estimatedSavingsMs` is overwritten with the digest's number for that audit. Audits with no savings can't be rated "high". The prompt tells the model the digest is data, not instructions.
- **Layered limits.** Audits: 5 per hour per IP. Analyses: 3 per hour per IP, plus a global daily cap. Cache hits skip all limits. The rate limiters and the daily cap fail closed if Redis is unavailable; reads of cached data fail open. A report that can't be saved is reported as an error, because the result lives at `/report/[id]`.
- **Daily cap follows the provider's clock.** The AI daily counter resets at midnight Pacific, when Google's daily quota resets, and is set to 85% of the free-tier daily limit (see `ANALYZE_DAILY_CAP` in `lib/redis.ts`).
- **Streaming with `useObject`.** The server uses `streamText` with `Output.object`; the client renders each recommendation once it is complete.

## Environment variables

Create `.env.local` (never commit it):

| Variable | Purpose |
| --- | --- |
| `PSI_API_KEY` | Google PageSpeed Insights API key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (cache and rate limits) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key, used by `@ai-sdk/google` |

## Run it

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm test     # unit tests for lib/normalize.ts
pnpm lint
pnpm build
```

## Things to know

- **Report links are unauthenticated.** A report id is a truncated hash of the URL, device and date, so it is not a secret. Reports contain only public performance data and are marked `noindex`.
- **DNS rebinding.** `url-guard` checks the URL as written: scheme, port, and literal IP or local hostnames. It does not resolve DNS, so a public hostname that resolves to a private address would pass the check. This app never fetches user URLs itself; PSI does that from Google's servers, which limits the risk. Resolve and pin the IP if you ever fetch user URLs server-side.
- **Free-tier data use.** The AI step uses the Gemini API free tier. Google's terms for free-tier usage may allow it to use inputs and outputs to improve its products. Only the audit digest (public performance data) is sent, but check Google's current Gemini API terms and pricing pages before using this with anything sensitive.
- **Lab vs. field data.** Lab data comes from one Lighthouse run in a simulated environment. Field data comes from real Chrome users (CrUX) and is only available for URLs with enough traffic. The two often disagree, and both are shown.
- **Run-to-run variance.** Lighthouse results vary between runs because of network conditions, server load, third-party scripts and CPU contention. Treat a single run as a sample, not a measurement. Audits are cached per URL, device and day, so viewing the same report repeatedly shows the same numbers.
- **Ratings.** Tiles are rated with Google's published good/poor bands for each metric, and the same bands are applied to mobile and desktop results. The bands are defined in one constant at the top of `components/VitalsGrid.tsx`.
