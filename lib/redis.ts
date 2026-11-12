import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { AuditDigest, Recommendations } from "./schemas";

const SEVEN_DAYS = 60 * 60 * 24 * 7;

const redis = Redis.fromEnv();
const limiters = {
  audit: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "rl:audit" }),
  analyze: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 h"), prefix: "rl:analyze" }),
};

// 85% of the Gemini free-tier limit (500 requests/day) leaves headroom for retries.
const ANALYZE_DAILY_CAP = Math.floor(500 * 0.85);

export function cacheKey(url: URL, strategy: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const normalized = `${url.protocol}//${url.host}${url.pathname}${url.search}`;
  return createHash("sha256").update(`${normalized}|${strategy}|${day}`).digest("hex").slice(0, 32);
}

// Cache fails open: a Redis outage only makes audits slower.
export async function getReport(id: string): Promise<AuditDigest | null> {
  try {
    const parsed = AuditDigest.safeParse(await redis.get(`report:${id}`));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function setReport(id: string, digest: AuditDigest): Promise<void> {
  try {
    await redis.set(`report:${id}`, digest, { ex: SEVEN_DAYS });
  } catch {}
}

// Rate limiter fails closed: without it anyone could burn the PSI quota.
export async function checkRateLimit(kind: keyof typeof limiters, ip: string): Promise<"ok" | "limited" | "error"> {
  try {
    return (await limiters[kind].limit(ip)).success ? "ok" : "limited";
  } catch {
    return "error";
  }
}

export async function getRecs(id: string): Promise<Recommendations | null> {
  try {
    const parsed = Recommendations.safeParse(await redis.get(`recs:${id}`));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function setRecs(id: string, recs: Recommendations): Promise<void> {
  try {
    await redis.set(`recs:${id}`, recs, { ex: SEVEN_DAYS });
  } catch {}
}

// Google's daily quota resets at midnight Pacific, so the counter's day must too.
const pacificDay = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
const dayKey = () => `analyze:day:${pacificDay()}`;

// Both daily-cap functions fail closed: unknown usage means we can't risk the quota.
export async function dailyCapReached(): Promise<boolean> {
  try {
    return Number((await redis.get(dayKey())) ?? 0) >= ANALYZE_DAILY_CAP;
  } catch {
    return true;
  }
}

export async function reserveAnalyzeCall(): Promise<boolean> {
  try {
    const key = dayKey();
    const count = await redis.incr(key);
    await redis.expire(key, 60 * 60 * 24 * 2);
    return count <= ANALYZE_DAILY_CAP;
  } catch {
    return false;
  }
}
