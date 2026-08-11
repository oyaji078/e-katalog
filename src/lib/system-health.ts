import { existsSync, statSync } from "node:fs";
import path from "node:path";

import { getDb } from "@/lib/db";

export type HealthStatus = "OK" | "WARN" | "ERROR";

export type HealthCheck = {
  status: HealthStatus;
  detail: string;
};

export async function getDatabaseHealth(): Promise<HealthCheck> {
  try {
    const db = getDb();
    await db.$queryRaw`SELECT 1`;
    return { status: "OK", detail: "Database dapat diakses." };
  } catch {
    return { status: "ERROR", detail: "Database tidak dapat diakses." };
  }
}

export async function getRedisHealth(): Promise<HealthCheck> {
  const url = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
  if (!url) {
    return { status: "WARN", detail: "Redis tidak dikonfigurasi (REDIS_URL tidak diset)." };
  }
  try {
    const { default: Redis } = await import("ioredis");
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy: () => null,
    });
    await client.ping();
    client.disconnect();
    return { status: "OK", detail: "Redis dapat diakses." };
  } catch {
    return { status: "ERROR", detail: "Redis tidak dapat diakses." };
  }
}

export async function getAuthHealth(): Promise<HealthCheck> {
  try {
    const db = getDb();
    const [accountCount, sessionCount] = await Promise.all([
      db.account.count(),
      db.session.count({ where: { expiresAt: { gt: new Date() } } }),
    ]);
    return {
      status: "OK",
      detail: `${accountCount} akun auth, ${sessionCount} sesi aktif.`,
    };
  } catch {
    return { status: "WARN", detail: "Status auth tidak dapat dibaca." };
  }
}

export function getUploadHealth(): HealthCheck {
  const uploadDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
  const siteDir = path.join(/*turbopackIgnore: true*/ uploadDir, "site");

  try {
    const uploadExists = existsSync(/*turbopackIgnore: true*/ uploadDir);
    const siteExists = existsSync(/*turbopackIgnore: true*/ siteDir);
    const uploadIsDirectory = uploadExists && statSync(/*turbopackIgnore: true*/ uploadDir).isDirectory();
    const siteIsDirectory = siteExists && statSync(/*turbopackIgnore: true*/ siteDir).isDirectory();

    if (uploadIsDirectory && siteIsDirectory) {
      return { status: "OK", detail: "Folder public/uploads dan uploads/site tersedia." };
    }

    return {
      status: "WARN",
      detail: "Folder upload belum lengkap; akan dibuat saat upload pertama.",
    };
  } catch {
    return { status: "ERROR", detail: "Folder upload tidak dapat dibaca." };
  }
}

export function configured(value: string | undefined) {
  return value ? "Configured" : "Missing";
}

export function shortSha(value: string | undefined) {
  return value ? value.slice(0, 12) : "-";
}

export function getMaskedEnvironmentRows() {
  return [
    ["NODE_ENV", process.env.NODE_ENV ?? "-"],
    ["DATABASE_URL", configured(process.env.DATABASE_URL)],
    ["BETTER_AUTH_URL", configured(process.env.BETTER_AUTH_URL)],
    ["NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL ?? "-"],
    ["STORE_WHATSAPP_NUMBER", configured(process.env.STORE_WHATSAPP_NUMBER)],
  ];
}

export function getDeploymentRows() {
  return [
    ["Runtime", `Node ${process.version}`],
    ["Platform", process.platform],
    ["Vercel Environment", process.env.VERCEL_ENV ?? "-"],
    ["Vercel URL", process.env.VERCEL_URL ?? "-"],
    ["Commit", shortSha(process.env.VERCEL_GIT_COMMIT_SHA)],
  ];
}
