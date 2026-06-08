import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { badRequest } from "@/lib/api-response";
import {
  canSeeRetailPrice,
  canUseRetailVoucher,
  productCardSelect,
  voucherWithScopeSelect,
} from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { toProductCardProps } from "@/lib/product-card-mapper";
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { getCurrentUser } from "@/lib/session";

// Node.js runtime: the in-memory rate-limit store requires a persistent process.
export const runtime = "nodejs";

const savedSchema = z.object({
  productIds: z.array(z.string()).max(100),
});

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, RATE_LIMITS.savedProducts);
  if (!rateLimit.success) return tooManyRequests(rateLimit);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return applyRateLimitHeaders(badRequest("Invalid JSON body"), rateLimit);
  }

  const parsed = savedSchema.safeParse(json);
  if (!parsed.success) {
    return applyRateLimitHeaders(
      badRequest("productIds must be an array of strings (max 100)"),
      rateLimit,
    );
  }

  try {
    const uniqueIds = Array.from(new Set(parsed.data.productIds));

    if (uniqueIds.length === 0) {
      return applyRateLimitHeaders(NextResponse.json({ products: [] }), rateLimit);
    }

    const db = getDb();
    const now = new Date();

    const [user, retailPriceEnabled, publicVoucherEnabled, retailVoucherEnabled] =
      await Promise.all([
        getCurrentUser().catch(() => null),
        isFeatureEnabled("enable_retail_price"),
        isFeatureEnabled("enable_public_voucher"),
        isFeatureEnabled("enable_retail_voucher"),
      ]);

    const [products, vouchers] = await Promise.all([
      db.product.findMany({
        where: {
          status: "ACTIVE",
          category: { isActive: true },
          brand: { isActive: true },
          OR: [
            { id: { in: uniqueIds } },
            { slug: { in: uniqueIds } },
            { sku: { in: uniqueIds } },
          ],
        },
        select: productCardSelect,
      }),
      db.voucher.findMany({
        where: {
          isActive: true,
          status: "ACTIVE",
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
        select: voucherWithScopeSelect,
      }),
    ]);

    const productMap = new Map<string, (typeof products)[number]>();
    for (const product of products) {
      productMap.set(product.id, product);
      productMap.set(product.sku, product);
      if (product.slug) productMap.set(product.slug, product);
    }
    const orderedProducts = uniqueIds.flatMap((id) => {
      const product = productMap.get(id);
      if (!product) return [];
      return [
        toProductCardProps(product, {
          user,
          retailPriceEnabled,
          publicVoucherEnabled,
          retailVoucherEnabled,
          vouchers,
        }),
      ];
    });

    return applyRateLimitHeaders(
      NextResponse.json({
        products: orderedProducts,
        canSeeRetailPrice: canSeeRetailPrice(user, retailPriceEnabled),
        canSeeRetailVoucher: canUseRetailVoucher(user),
      }),
      rateLimit,
    );
  } catch {
    return applyRateLimitHeaders(NextResponse.json({ products: [] }), rateLimit);
  }
}
