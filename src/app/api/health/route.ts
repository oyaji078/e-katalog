import { NextResponse } from "next/server";

import { getDatabaseHealth, getRedisHealth, getUploadHealth } from "@/lib/system-health";

export const runtime = "nodejs";

export async function GET() {
  const [db, redis, upload] = await Promise.all([
    getDatabaseHealth(),
    getRedisHealth(),
    Promise.resolve(getUploadHealth()),
  ]);

  const allChecks = { database: db, redis, upload };
  const critical = [db];
  const hasError = critical.some((c) => c.status === "ERROR");
  const statusCode = hasError ? 503 : 200;

  return NextResponse.json(
    {
      status: hasError ? "degraded" : "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "development",
      checks: allChecks,
    },
    { status: statusCode },
  );
}
