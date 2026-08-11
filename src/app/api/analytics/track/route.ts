import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { AnalyticsEventType } from "@/generated/prisma/client";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";

export const runtime = "nodejs";

const trackSchema = z.object({
  type: z.nativeEnum(AnalyticsEventType),
  path: z.string().optional(),
  productId: z.string().optional(),
  productName: z.string().optional(),
  phone: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, RATE_LIMITS.analyticsTrack);
  if (!rateLimit.success) return tooManyRequests(rateLimit);

  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return applyRateLimitHeaders(
        NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 }),
        rateLimit,
      );
    }

    const parsed = trackSchema.safeParse(json);
    if (!parsed.success) {
      return applyRateLimitHeaders(
        NextResponse.json({ ok: false, error: "Invalid event type or payload" }, { status: 400 }),
        rateLimit,
      );
    }

    await trackAnalyticsEvent(parsed.data);

    return applyRateLimitHeaders(NextResponse.json({ ok: true }), rateLimit);
  } catch (error) {
    logger.error({ err: error, route: "analytics/track" }, "Analytics track failed");
    return applyRateLimitHeaders(
      NextResponse.json({ ok: false, error: "Invalid analytics request" }, { status: 400 }),
      rateLimit,
    );
  }
}
