import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";

export const runtime = "nodejs";

const trackSchema = z.object({
  event: z.enum(["view", "click"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimit = await checkRateLimit(request, RATE_LIMITS.productTrack);
  if (!rateLimit.success) return tooManyRequests(rateLimit);

  try {
    const { id } = await params;
    if (!id) {
      return applyRateLimitHeaders(
        NextResponse.json({ ok: false, error: "ID produk diperlukan." }, { status: 400 }),
        rateLimit,
      );
    }

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
        NextResponse.json({ ok: false, error: "Event tidak valid." }, { status: 400 }),
        rateLimit,
      );
    }

    const { event } = parsed.data;
    const db = getDb();

    const product = await db.product.findFirst({
      where: {
        status: "ACTIVE",
        OR: [{ slug: id }, { sku: id }],
      },
      select: { id: true },
    });

    if (!product) {
      return applyRateLimitHeaders(
        NextResponse.json({ ok: false, error: "Produk tidak ditemukan." }, { status: 404 }),
        rateLimit,
      );
    }

    await db.product.update({
      where: { id: product.id },
      data: event === "view"
        ? { viewCount: { increment: 1 } }
        : { clickCount: { increment: 1 } },
    });

    return applyRateLimitHeaders(NextResponse.json({ ok: true }), rateLimit);
  } catch (error) {
    logger.error({ err: error, route: "products/track" }, "Product track failed");
    return applyRateLimitHeaders(
      NextResponse.json({ ok: false, error: "Gagal memproses permintaan." }, { status: 500 }),
      rateLimit,
    );
  }
}
