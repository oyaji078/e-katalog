import { NextResponse } from "next/server";

import { describeDbError, prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read-only database health probe.
 *
 * Runs a single `SELECT 1` through the shared Prisma singleton. It reads no
 * table, writes nothing, and never returns the connection string, credentials
 * or host. `reason` is a fixed category (see describeDbError) so an operator
 * can tell an unreachable host from rejected credentials without any secret
 * leaving the process.
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const durationMs = Date.now() - startedAt;

    logger.info({ operation: "health.db", durationMs }, "database reachable");

    return NextResponse.json(
      { ok: true, database: "reachable", durationMs },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const reason = describeDbError(error);

    logger.error({ operation: "health.db", durationMs, reason }, "database unreachable");

    return NextResponse.json(
      { ok: false, database: "unreachable", reason, durationMs },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
