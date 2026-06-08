import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";

// Node.js runtime: the in-memory rate-limit store requires a persistent process.
export const runtime = "nodejs";

type TrackEvent = "view" | "click";

function parseEvent(value: unknown): TrackEvent | null {
  return value === "view" || value === "click" ? value : null;
}

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

    let body: { event?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const event = parseEvent(body.event);
    if (!event) {
      return applyRateLimitHeaders(
        NextResponse.json({ ok: false, error: "Event tidak valid." }, { status: 400 }),
        rateLimit,
      );
    }

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
  } catch {
    return applyRateLimitHeaders(
      NextResponse.json({ ok: false, error: "Gagal memproses permintaan." }, { status: 500 }),
      rateLimit,
    );
  }
}
