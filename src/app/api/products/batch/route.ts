import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/api-response";
import { getDb } from "@/lib/db";
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";

// Node.js runtime: the in-memory rate-limit store requires a persistent process.
export const runtime = "nodejs";

const batchSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50),
});

/**
 * Batch fetch products by IDs for saved products feature.
 * POST /api/products/batch with { ids: string[] }
 */
export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimit(req, RATE_LIMITS.productsBatch);
  if (!rateLimit.success) return tooManyRequests(rateLimit);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return applyRateLimitHeaders(badRequest("Invalid JSON body"), rateLimit);
  }

  const parsed = batchSchema.safeParse(json);
  if (!parsed.success) {
    return applyRateLimitHeaders(
      badRequest("Invalid ids: must be an array with 1-50 items"),
      rateLimit,
    );
  }
  const { ids } = parsed.data;

  try {
    const db = getDb();

    // Fetch products - only ACTIVE ones, minimal fields for card display.
    // Saved identifiers may be a product id, slug, or sku (see product-card-mapper).
    const products = await db.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ id: { in: ids } }, { slug: { in: ids } }, { sku: { in: ids } }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        publicPrice: true,
        // retailPrice intentionally NOT selected: this public endpoint must not
        // expose retail pricing to guests. Use /api/products/saved (role-gated).
        specifications: true,
        primaryImageUrl: true,
        stockStatus: true,
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return applyRateLimitHeaders(
      NextResponse.json({ products, count: products.length }),
      rateLimit,
    );
  } catch (error) {
    console.error("Batch fetch error:", error);
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Failed to fetch products" }, { status: 500 }),
      rateLimit,
    );
  }
}
