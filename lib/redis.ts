import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { AuditDigest } from "./schemas";

const SEVEN_DAYS = 60 * 60 * 24 * 7;

const redis = Redis.fromEnv();
const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "rl:audit" });

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
export async function checkRateLimit(ip: string): Promise<"ok" | "limited" | "error"> {
  try {
    return (await limiter.limit(ip)).success ? "ok" : "limited";
  } catch {
    return "error";
  }
}
