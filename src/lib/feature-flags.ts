import type { AdminActionRisk, Prisma, UserRole } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";

/**
 * Check if a feature flag is enabled.
 * Missing flag defaults to false.
 * Database errors fail closed (treated as disabled).
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  try {
    const db = getDb();
    const flag = await db.featureFlag.findUnique({
      where: { key },
    });
    return flag?.enabled ?? false;
  } catch {
    return false;
  }
}

/**
 * Get full feature flag record. Returns null if missing or on error.
 */
export async function getFeatureFlag(key: string) {
  try {
    const db = getDb();
    return db.featureFlag.findUnique({
      where: { key },
    });
  } catch {
    return null;
  }
}

/**
 * Require a feature flag to be enabled.
 * Throws an error if disabled or missing. Call from server actions / API routes.
 */
export async function requireFeatureFlag(key: string, message?: string): Promise<void> {
  const enabled = await isFeatureEnabled(key);
  if (!enabled) {
    throw new Error(message ?? `Feature "${key}" is currently disabled.`);
  }
}

/**
 * Check if retail price can be displayed for a given user.
 * Combines feature flag check with user role/retail status.
 */
export async function canUseRetailPrice(user?: { role?: string | null; retailStatus?: string | null } | null): Promise<boolean> {
  const retailPriceEnabled = await isFeatureEnabled("enable_retail_price");
  if (!retailPriceEnabled) return false;
  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") return true;
  return user?.retailStatus === "RETAIL_ACTIVE";
}

/**
 * Safely log admin activity.
 * Respects enable_admin_activity_log flag.
 * Never throws — logging failures are silently ignored.
 */
export async function safeLogAdminActivity(data: {
  actorId?: string | null;
  actorRole?: UserRole | string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  risk?: AdminActionRisk;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    const loggingEnabled = await isFeatureEnabled("enable_admin_activity_log");
    if (!loggingEnabled) return;

    const db = getDb();
    await db.adminActivityLog.create({
      data: {
        actorId: data.actorId ?? null,
        actorRole: (data.actorRole ?? null) as UserRole | null,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId ?? null,
        risk: data.risk ?? "MEDIUM",
        metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  } catch {
    // Silently ignore logging failures — must not break main operation
  }
}
