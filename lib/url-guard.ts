export type GuardResult = { ok: true; url: URL } | { ok: false; error: string };

function isPrivateV4(host: string): boolean {
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateV6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (!h.includes(":")) return false;
  return h === "::" || h === "::1" || /^(fc|fd|fe[89ab])/.test(h) || h.startsWith("::ffff:");
}

export function guardUrl(input: string): GuardResult {
  let url: URL;
  try {
    url = new URL(input.includes("://") ? input : `https://${input}`);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed." };
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    return { ok: false, error: "Only the standard ports 80 and 443 are allowed." };
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
    host.endsWith(".internal") || isPrivateV4(host) || isPrivateV6(host)
  ) {
    return { ok: false, error: "Private, local and reserved addresses can't be audited." };
  }
  return { ok: true, url };
}
