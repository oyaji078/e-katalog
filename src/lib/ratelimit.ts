import { NextResponse } from "next/server";

/**
 * IP-based rate limiting for public POST endpoints.
 *
 * Strategy: a fixed-window counter (max N requests per fixed time window per
 * key). The window boundary maps cleanly onto the `X-RateLimit-Reset` header,
 * which is why it is preferred here over a sliding log.
 *
 * Storage: an in-memory `Map` by default. This is correct for a single
 * long-lived Node process (`next start`) but does NOT share state across
 * multiple instances or serverless invocations.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ PRODUCTION NOTE: For multi-instance / serverless deployments, replace the │
 * │ in-memory store with a shared backend (Redis / Upstash). The seam is the  │
 * │ `RateLimitStore` interface below — implement `increment()` against Redis  │
 * │ (e.g. INCR + PEXPIRE, or @upstash/ratelimit) and swap `getStore()`. The   │
 * │ rest of this module (headers, 429 shape, abuse logging) stays unchanged.  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * These routes run on the Node.js runtime (see `export const runtime` in each
 * handler) because the in-memory store requires a persistent process.
 */

/** A single fixed-window counter for one key. `resetAt` is epoch milliseconds. */
interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Pluggable storage seam. Implement this against Redis/Upstash for production
 * multi-instance deployments; the in-memory implementation is the default.
 */
interface RateLimitStore {
  increment(key: string, windowMs: number, now: number): Bucket;
}

export interface RateLimitConfig {
  /** Stable name used in the storage key, logs, and metrics (e.g. "analytics/track"). */
  name: string;
  /** Maximum number of requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  /** True when the request is within the limit and should be allowed. */
  success: boolean;
  /** The configured limit (for the X-RateLimit-Limit header). */
  limit: number;
  /** Requests remaining in the current window (never negative). */
  remaining: number;
  /** Epoch milliseconds when the current window resets. */
  reset: number;
  /** Seconds until the window resets. 0 when the request is allowed. */
  retryAfter: number;
  /** Resolved client identifier (IP) that was rate-limited. */
  ip: string;
}

/** Per-endpoint limits. Centralised so the rules live in one place. */
export const RATE_LIMITS = {
  /** POST /api/analytics/track — high-volume client telemetry. */
  analyticsTrack: { name: "analytics/track", limit: 30, windowMs: 60_000 },
  /** POST /api/products/[id]/track — view/click counters. */
  productTrack: { name: "products/track", limit: 20, windowMs: 60_000 },
  /** POST /api/inquiries/whatsapp — sensitive, generates WhatsApp links + logs. */
  inquiriesWhatsapp: { name: "inquiries/whatsapp", limit: 5, windowMs: 60_000 },
  /** POST /api/vouchers/claim — sensitive write; per-user/voucher idempotency
   *  is additionally enforced atomically at the DB layer (unique constraint). */
  vouchersClaim: { name: "vouchers/claim", limit: 3, windowMs: 60_000 },
  /** POST /api/products/saved — public batch lookup of saved-product cards. */
  savedProducts: { name: "products/saved", limit: 60, windowMs: 60_000 },
  /** POST /api/products/batch — public batch lookup by id/slug/sku. */
  productsBatch: { name: "products/batch", limit: 60, windowMs: 60_000 },
  /** POST /api/retail/request-whatsapp — sensitive (mutates retail status + builds OTP request link). */
  retailWhatsapp: { name: "retail/request-whatsapp", limit: 5, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

const SWEEP_INTERVAL_MS = 60_000;
/** Hard cap on tracked keys; protects against unbounded growth under a flood of unique IPs. */
const MAX_KEYS = 100_000;
/** Shared bucket that absorbs new keys once MAX_KEYS is reached (fail-closed, bounds memory). */
const OVERFLOW_KEY = "__overflow__";

// Persist the store across dev hot-reloads (mirrors the Prisma singleton in db.ts).
const globalForRateLimit = globalThis as typeof globalThis & {
  __rateLimitStore?: Map<string, Bucket>;
  __rateLimitSweeperStarted?: boolean;
};

// TODO: replace with Redis for multi-instance/serverless production.
if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL) {
  console.warn("[rate-limit] WARNING: using in-memory store. Set REDIS_URL for production.");
}

function startSweeper(map: Map<string, Bucket>): void {
  if (globalForRateLimit.__rateLimitSweeperStarted) return;
  globalForRateLimit.__rateLimitSweeperStarted = true;

  // Periodically evict expired windows so the map does not grow forever.
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of map) {
      if (bucket.resetAt <= now) map.delete(key);
    }
  }, SWEEP_INTERVAL_MS);

  // Do not keep the Node process alive solely for the sweeper.
  (timer as { unref?: () => void }).unref?.();
}

function getMap(): Map<string, Bucket> {
  if (!globalForRateLimit.__rateLimitStore) {
    globalForRateLimit.__rateLimitStore = new Map<string, Bucket>();
  }
  startSweeper(globalForRateLimit.__rateLimitStore);
  return globalForRateLimit.__rateLimitStore;
}

/** Default in-memory fixed-window store. */
const memoryStore: RateLimitStore = {
  increment(key, windowMs, now) {
    const map = getMap();

    // Capacity guard: only a *new* key can grow the map (replacing an existing
    // or expired key via map.set keeps size constant). When at capacity, first
    // evict expired windows; if that does not free a slot (e.g. a flood of many
    // simultaneous unique IPs), collapse further new keys into one shared
    // overflow bucket. This bounds memory at MAX_KEYS+1 and fails CLOSED —
    // excess distinct clients share a single conservative limit rather than
    // each getting an un-counted free pass.
    if (!map.has(key) && map.size >= MAX_KEYS) {
      for (const [k, b] of map) {
        if (b.resetAt <= now) map.delete(k);
      }
      if (map.size >= MAX_KEYS) {
        key = OVERFLOW_KEY;
      }
    }

    let bucket = map.get(key);

    // Start a fresh window if none exists or the previous one has expired.
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      map.set(key, bucket);
    }

    bucket.count += 1;
    return bucket;
  },
};

/** Swap this to a Redis-backed store for production multi-instance deployments. */
function getStore(): RateLimitStore {
  return memoryStore;
}

/**
 * Extract the client IP from proxy headers. Works behind Nginx / Vercel /
 * Cloudflare. Falls back to a shared "unknown" bucket (fail-closed) when no
 * forwarding header is present, so requests without an identifiable source
 * still share a single conservative limit rather than bypassing the limiter.
 */
export function getClientIp(request: { headers: Headers }): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // The left-most entry is the originating client.
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();

  return "unknown";
}

/** Set to "true"/"1" to disable rate limiting (e.g. local dev, integration tests). */
function isDisabled(): boolean {
  const flag = process.env.RATE_LIMIT_DISABLED;
  return flag === "true" || flag === "1";
}

/** Structured abuse log for monitoring/alerting (IP + endpoint + timestamp). */
function logRateLimitAbuse(info: { ip: string; endpoint: string; limit: number; windowMs: number }): void {
  console.warn(
    `[ratelimit] BLOCKED ip=${info.ip} endpoint=${info.endpoint} ` +
      `limit=${info.limit}/${Math.round(info.windowMs / 1000)}s at=${new Date().toISOString()}`,
  );
}

/**
 * Check (and consume) one unit of the rate limit for the given request.
 *
 * Async so a future Redis-backed store can be awaited without touching callers.
 *
 * @param request    Anything carrying request `headers` (NextRequest / Request).
 * @param config     One of `RATE_LIMITS`, or a custom `RateLimitConfig`.
 * @param identifier Optional override for the per-key identity (defaults to client IP).
 */
export async function checkRateLimit(
  request: { headers: Headers },
  config: RateLimitConfig,
  identifier?: string,
): Promise<RateLimitResult> {
  const ip = getClientIp(request);

  if (isDisabled()) {
    return { success: true, limit: config.limit, remaining: config.limit, reset: Date.now() + config.windowMs, retryAfter: 0, ip };
  }

  const now = Date.now();
  const key = `${config.name}:${identifier ?? ip}`;
  const bucket = getStore().increment(key, config.windowMs, now);

  const success = bucket.count <= config.limit;
  const remaining = Math.max(0, config.limit - bucket.count);
  const retryAfter = success ? 0 : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  if (!success) {
    logRateLimitAbuse({ ip, endpoint: config.name, limit: config.limit, windowMs: config.windowMs });
  }

  return { success, limit: config.limit, remaining, reset: bucket.resetAt, retryAfter, ip };
}

/**
 * Attach the standard rate-limit headers to any response.
 * `X-RateLimit-Reset` is expressed as a UTC epoch in **seconds** (GitHub convention).
 */
export function applyRateLimitHeaders<T extends Response>(
  response: T,
  result: RateLimitResult,
  options?: { includeRetryAfter?: boolean },
): T {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.reset / 1000)));
  if (options?.includeRetryAfter) {
    response.headers.set("Retry-After", String(result.retryAfter));
  }
  return response;
}

/**
 * Build the 429 response: JSON `{ error, retryAfter }` plus rate-limit and
 * `Retry-After` headers. Return this directly from a route when `success` is false.
 */
export function tooManyRequests(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    { error: "Too many requests", retryAfter: result.retryAfter },
    { status: 429 },
  );
  return applyRateLimitHeaders(response, result, { includeRetryAfter: true });
}
