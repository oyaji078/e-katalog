import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { safeLogAdminActivity } from "@/lib/feature-flags";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let body: { flagKey: string; enabled: boolean; flagId?: string | null };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { flagKey, enabled, flagId } = body;

    if (!flagKey) {
      return NextResponse.json({ error: "flagKey is required" }, { status: 400 });
    }

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
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
