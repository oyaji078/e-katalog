import { NextRequest, NextResponse } from "next/server";

import { AnalyticsEventType, type AnalyticsEventType as AnalyticsEventTypeValue } from "@/generated/prisma/client";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";

// Node.js runtime: the in-memory rate-limit store requires a persistent process.
export const runtime = "nodejs";

const PUBLIC_ANALYTICS_TYPES: AnalyticsEventTypeValue[] = [
  AnalyticsEventType.PAGE_VIEW,
  AnalyticsEventType.PRODUCT_VIEW,
  AnalyticsEventType.WHATSAPP_CLICK,
  AnalyticsEventType.SAVED_PRODUCT,
  AnalyticsEventType.UNSAVED_PRODUCT,
];

function isPublicAnalyticsType(value: unknown): value is AnalyticsEventTypeValue {
  return typeof value === "string" && PUBLIC_ANALYTICS_TYPES.includes(value as AnalyticsEventTypeValue);
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function optionalMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, RATE_LIMITS.analyticsTrack);
  if (!rateLimit.success) return tooManyRequests(rateLimit);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const type = body.type;

    if (!isPublicAnalyticsType(type)) {
      return applyRateLimitHeaders(
        NextResponse.json({ ok: false, error: "Invalid event type" }, { status: 400 }),
        rateLimit,
      );
    }

    await trackAnalyticsEvent({
      type,
      path: optionalString(body.path),
      productId: optionalString(body.productId),
      productName: optionalString(body.productName),
      phone: optionalString(body.phone),
      metadata: optionalMetadata(body.metadata),
    });

    return applyRateLimitHeaders(NextResponse.json({ ok: true }), rateLimit);
  } catch {
    return applyRateLimitHeaders(
      NextResponse.json({ ok: false, error: "Invalid analytics request" }, { status: 400 }),
      rateLimit,
    );
  }
}
