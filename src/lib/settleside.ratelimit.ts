import "@tanstack/react-start/server-only";

// In-memory sliding-window limiter. Correct for a single long-running server
// (local dev, Fly.io). If the app ever moves to per-request serverless
// (e.g. Netlify Functions), swap the bucket store for a durable backend.

const buckets = new Map<string, number[]>();

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}

export function rateLimit(options: { key: string; max: number; windowMs: number }): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const bucket = (buckets.get(options.key) ?? []).filter((time) => time > windowStart);

  if (bucket.length >= options.max) {
    buckets.set(options.key, bucket);
    const retryAfterSeconds = Math.ceil((bucket[0] + options.windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  bucket.push(now);
  buckets.set(options.key, bucket);

  if (buckets.size > 10_000) {
    for (const [key, times] of buckets) {
      if (times.every((time) => time <= windowStart)) {
        buckets.delete(key);
      }
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function tooManyRequests(message: string, retryAfterSeconds: number) {
  return Response.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
