import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { safeLogAdminActivity } from "@/lib/feature-flags";
import { logger } from "@/lib/logger";

const toggleSchema = z.object({
  flagKey: z.string().min(1, "flagKey is required"),
  enabled: z.boolean(),
  flagId: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = toggleSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    const { flagKey, enabled, flagId } = parsed.data;
    const db = getDb();

    if (flagId) {
      await db.featureFlag.update({
        where: { id: flagId },
        data: { enabled, updatedByUserId: user.id },
      });
    } else {
      await db.featureFlag.create({
        data: {
          key: flagKey,
          name: flagKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          description: `Auto-created flag: ${flagKey}`,
          enabled,
          updatedByUserId: user.id,
        },
      });
    }

    await safeLogAdminActivity({
      actorId: user.id,
      actorRole: "SUPER_ADMIN",
      action: `FEATURE_FLAG_TOGGLE:${flagKey}=${enabled}`,
      targetType: "feature_flag",
      targetId: flagKey,
      risk: "MEDIUM",
    });

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    logger.error({ err: error, route: "admin/feature-flags/toggle" }, "Feature flag toggle failed");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
