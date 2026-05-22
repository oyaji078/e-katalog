import type { AdminActionRisk, Prisma, UserRole } from "@/generated/prisma/client";

import { safeLogAdminActivity } from "@/lib/feature-flags";

type LogAdminActivityInput = {
  actorId?: string | null;
  actorRole?: UserRole | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  risk?: AdminActionRisk;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Log admin activity. Respects the enable_admin_activity_log feature flag.
 * If the flag is disabled, the log is silently skipped.
 * Never throws.
 */
export async function logAdminActivity(input: LogAdminActivityInput) {
  return safeLogAdminActivity({
    actorId: input.actorId ?? null,
    actorRole: input.actorRole ?? null,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    risk: input.risk ?? "MEDIUM",
    metadata: input.metadata as Record<string, unknown> | undefined,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });
}
