import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";
import { logger } from "@/lib/logger";

const globalForPrisma = globalThis as typeof globalThis & {
  prismaClient?: PrismaClient;
};

/**
 * Pool defaults tuned for a single Node process on shared hosting.
 *
 * Prisma v7 uses a driver adapter here, so the `connection_limit` and
 * `pool_timeout` query parameters understood by Prisma's own engine are NOT
 * read by anything -- the pool belongs to the `mariadb` driver. Its defaults
 * (connectionLimit 10, acquireTimeout 10s) are what produced the production
 * error "pool timeout: failed to retrieve a connection from pool after
 * 10001ms (pool connections: active=0 idle=0 limit=10)".
 *
 * We therefore parse those parameters out of DATABASE_URL ourselves and map
 * them onto the driver's own option names, so the URL stays the single place
 * where this is configured.
 */
const DEFAULT_CONNECTION_LIMIT = 3;
const DEFAULT_ACQUIRE_TIMEOUT_MS = 20_000;
const DEFAULT_CONNECT_TIMEOUT_MS = 10_000;

function intFromParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Turn DATABASE_URL into an explicit mariadb PoolConfig.
 *
 * Credentials are only ever read from the environment and passed straight to
 * the driver -- they are never logged, and never returned to a caller.
 */
export function buildPoolConfig(rawUrl: string) {
  const url = new URL(rawUrl);
  const params = url.searchParams;

  // Prisma expresses these timeouts in seconds; the driver wants milliseconds.
  const poolTimeoutSeconds = params.get("pool_timeout");
  const connectTimeoutSeconds = params.get("connect_timeout");

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),

    // MariaDB/MySQL 8 with caching_sha2_password refuses to hand over its
    // public key on an unencrypted channel unless this is enabled. Honour the
    // URL exactly rather than assuming, since enabling it weakens MITM
    // protection on a plaintext connection.
    allowPublicKeyRetrieval: params.get("allowPublicKeyRetrieval") === "true",
    ...(params.get("ssl") === "true" ? { ssl: true } : {}),

    connectionLimit: intFromParam(
      params.get("connection_limit"),
      DEFAULT_CONNECTION_LIMIT,
    ),
    acquireTimeout: poolTimeoutSeconds
      ? intFromParam(poolTimeoutSeconds, 20) * 1000
      : DEFAULT_ACQUIRE_TIMEOUT_MS,
    connectTimeout: connectTimeoutSeconds
      ? intFromParam(connectTimeoutSeconds, 10) * 1000
      : DEFAULT_CONNECT_TIMEOUT_MS,

    // Give up on creating a brand-new connection rather than hanging until the
    // acquire timeout, so an unreachable host surfaces a connect error (which
    // names the cause) instead of an opaque pool timeout.
    initializationTimeout: DEFAULT_CONNECT_TIMEOUT_MS,

    // Shared-hosting MySQL closes idle connections aggressively; releasing them
    // first avoids handing a dead socket to the next query. Seconds.
    idleTimeout: 60,
  };
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required before using the database client.");
  }

  const config = buildPoolConfig(databaseUrl);

  // Host and pool shape are safe to log and make production incidents legible.
  // User, password and database name are deliberately omitted.
  logger.info(
    {
      dbHost: config.host,
      dbPort: config.port,
      connectionLimit: config.connectionLimit,
      acquireTimeoutMs: config.acquireTimeout,
      connectTimeoutMs: config.connectTimeout,
    },
    "prisma: initialising connection pool",
  );

  const adapter = new PrismaMariaDb(config, { useTextProtocol: true });
  return new PrismaClient({ adapter });
}

export function getDb() {
  if (!globalForPrisma.prismaClient) {
    globalForPrisma.prismaClient = createPrismaClient();
  }

  return globalForPrisma.prismaClient;
}

/**
 * Map a database failure onto a short, credential-free description.
 *
 * Used by the health endpoints so an operator can tell "wrong password" from
 * "host unreachable" from "pool exhausted" without exposing anything sensitive.
 */
export function describeDbError(error: unknown): string {
  const err = error as { code?: string; message?: string } | undefined;
  const code = err?.code ?? "";
  const message = err?.message ?? "";

  if (code === "P2024" || /pool timeout/i.test(message)) {
    return "pool_timeout: no connection could be acquired";
  }
  if (code === "P1001" || /ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENOTFOUND/.test(code + message)) {
    return "unreachable: cannot open a socket to the database host";
  }
  if (/ER_ACCESS_DENIED/.test(code) || /Access denied/i.test(message)) {
    return "access_denied: host reachable, credentials rejected";
  }
  if (/ER_BAD_DB_ERROR|UNKNOWN_DATABASE/.test(code)) {
    return "unknown_database: credentials accepted, database name wrong";
  }
  if (/ER_CON_COUNT_ERROR|Too many connections/i.test(code + message)) {
    return "too_many_connections: server connection quota exhausted";
  }
  return code ? `error: ${code}` : "error: unrecognised database failure";
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const db = getDb();
    const value = db[property as keyof PrismaClient];

    if (typeof value === "function") {
      return value.bind(db);
    }

    return value;
  },
});
