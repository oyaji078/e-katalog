import { NextResponse } from "next/server";

/**
 * IP-based rate limiting for public POST endpoints.
 *
 * Strategy: a fixed-window counter (max N requests per fixed time window per
 * key). The window boundary maps cleanly onto the `X-RateLimit-Reset` header,
 * which is why it is preferred here over a sliding log.
 *
 * Storage: Redis (via ioredis) when REDIS_URL is set; otherwise falls back to
 * an in-memory Map.  The in-memory store is correct for a single Node process
 * (`next start`) but does NOT share state across multiple instances.
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
 * Pluggable storage seam. Implement this against Redis for production
 * multi-instance deployments; the in-memory implementation is the default.
 */
interface RateLimitStore {
  increment(key: string, windowMs: number, now: number): Promise<Bucket>;
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
  analyticsTrack: { name: "analytics/track", limit: 30, windowMs: 60_000 },
  productTrack: { name: "products/track", limit: 20, windowMs: 60_000 },
  inquiriesWhatsapp: { name: "inquiries/whatsapp", limit: 5, windowMs: 60_000 },
  vouchersClaim: { name: "vouchers/claim", limit: 3, windowMs: 60_000 },
  savedProducts: { name: "products/saved", limit: 60, windowMs: 60_000 },
  productsBatch: { name: "products/batch", limit: 60, windowMs: 60_000 },
  retailWhatsapp: { name: "retail/request-whatsapp", limit: 5, windowMs: 60_000 },
  retailActivation: { name: "retail/activate", limit: 5, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

const SWEEP_INTERVAL_MS = 60_000;
const MAX_KEYS = 100_000;
const OVERFLOW_KEY = "__overflow__";

// Persist the store across dev hot-reloads (mirrors the Prisma singleton in db.ts).
const globalForRateLimit = globalThis as typeof globalThis & {
  __rateLimitStore?: Map<string, Bucket>;
  __rateLimitSweeperStarted?: boolean;
  __redisClient?: import("ioredis").Redis;
  __redisLastAttempt?: number;
};

/* ------------------------------------------------------------------ */
/*  Redis client                                                      */
/* ------------------------------------------------------------------ */

const REDIS_RETRY_MS = 5_000;

function getRedisClient(): import("ioredis").Redis | null {
  const url = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
  if (!url) return null;
  if (globalForRateLimit.__redisClient) return globalForRateLimit.__redisClient;

  // Throttle reconnect attempts so a dead Redis does not hammer on every request.
  if (globalForRateLimit.__redisLastAttempt && Date.now() - globalForRateLimit.__redisLastAttempt < REDIS_RETRY_MS) {
    return null;
  }
  globalForRateLimit.__redisLastAttempt = Date.now();

  try {
    // Dynamic import so ioredis is not loaded when REDIS_URL is absent.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require("ioredis") as typeof import("ioredis").default;
    const client = new IORedis(url, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // do not auto-reconnect, fail fast
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    globalForRateLimit.__redisClient = client;
    return client;
  } catch {
    console.warn("[rate-limit] Redis unavailable, falling back to in-memory store.");
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  In-memory store (fallback)                                        */
/* ------------------------------------------------------------------ */

function startSweeper(map: Map<string, Bucket>): void {
  if (globalForRateLimit.__rateLimitSweeperStarted) return;
  globalForRateLimit.__rateLimitSweeperStarted = true;

  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of map) {
      if (bucket.resetAt <= now) map.delete(key);
    }
  }, SWEEP_INTERVAL_MS);

  (timer as { unref?: () => void }).unref?.();
}

function getMap(): Map<string, Bucket> {
  if (!globalForRateLimit.__rateLimitStore) {
    globalForRateLimit.__rateLimitStore = new Map<string, Bucket>();
  }
  startSweeper(globalForRateLimit.__rateLimitStore);
  return globalForRateLimit.__rateLimitStore;
}

const memoryStore: RateLimitStore = {
  async increment(key, windowMs, now) {
    const map = getMap();
    if (!map.has(key) && map.size >= MAX_KEYS) {
      for (const [k, b] of map) {
        if (b.resetAt <= now) map.delete(k);
      }
      if (map.size >= MAX_KEYS) {
        key = OVERFLOW_KEY;
      }
    }
    let bucket = map.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      map.set(key, bucket);
    }
    bucket.count += 1;
    return bucket;
  },
};

/* ------------------------------------------------------------------ */
/*  Redis store                                                        */
/* ------------------------------------------------------------------ */

const redisStore: RateLimitStore = {
  async increment(key, windowMs, now) {
    const client = getRedisClient();
    if (!client) {
      // Redis configured but connectivity failed — fall back to memory for this call.
      return memoryStore.increment(key, windowMs, now);
    }
    try {
      const prefixed = `ratelimit:${key}`;
      const count = await client.incr(prefixed);
      if (count === 1) {
        // First request in this window — set expiry.
        await client.pexpire(prefixed, windowMs).catch(() => {});
      }
      // Retrieve the remaining TTL to calculate resetAt.
      const ttl = await client.pttl(prefixed).catch(() => windowMs);
      const resetAt = ttl > 0 ? now + ttl : now + windowMs;
      return { count, resetAt };
    } catch {
      // Redis error — fall back to in-memory for this request.
      console.warn("[rate-limit] Redis error, falling back to in-memory.");
      return memoryStore.increment(key, windowMs, now);
    }
  },
};

/* ------------------------------------------------------------------ */
/*  Store resolution                                                   */
/* ------------------------------------------------------------------ */

async function getStore(): Promise<RateLimitStore> {
  const url = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
  if (url) {
    const client = getRedisClient();
    if (client) {
      try {
        await client.ping();
        return redisStore;
      } catch {
        // ping failed — will retry after REDIS_RETRY_MS
      }
    }
  }
  return memoryStore;
}

/**
 * Extract the client IP from proxy headers. Works behind Nginx / Vercel /
 * Cloudflare. Falls back to a shared "unknown" bucket (fail-closed) when no
 * forwarding header is present.
 */
export function getClientIp(request: { headers: Headers }): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();
  return "unknown";
}

function isDisabled(): boolean {
  const flag = process.env.RATE_LIMIT_DISABLED;
  return flag === "true" || flag === "1";
}

function logRateLimitAbuse(info: { ip: string; endpoint: string; limit: number; windowMs: number }): void {
  console.warn(
    `[ratelimit] BLOCKED ip=${info.ip} endpoint=${info.endpoint} ` +
      `limit=${info.limit}/${Math.round(info.windowMs / 1000)}s at=${new Date().toISOString()}`,
  );
}

/**
 * Check (and consume) one unit of the rate limit for the given request.
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
  const store = await getStore();
  const bucket = await store.increment(key, config.windowMs, now);

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
 * `Retry-After` headers.
 */
export function tooManyRequests(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    { error: "Too many requests", retryAfter: result.retryAfter },
    { status: 429 },
  );
  return applyRateLimitHeaders(response, result, { includeRetryAfter: true });
}
