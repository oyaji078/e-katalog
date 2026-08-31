import { NextRequest, NextResponse } from "next/server";

import { AnalyticsEventType } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { trackAnalyticsEvent } from "@/lib/analytics";
import {
  canSeeRetailPrice,
  canUseRetailVoucher,
  getEligibleProductVouchers,
  voucherLabel,
} from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { logger } from "@/lib/logger";
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { getCurrentUser } from "@/lib/session";
import { getPublicBaseUrl } from "@/lib/base-url";
import {
  buildInquiryMessage,
  buildProductUrl,
  buildWhatsappUrl,
  resolveStoreWhatsappNumber,
} from "@/lib/whatsapp";

// Node.js runtime: the in-memory rate-limit store requires a persistent process.
export const runtime = "nodejs";

function safeSourcePage(value: unknown) {
  if (typeof value !== "string") return "catalog";
  const trimmed = value.trim();
  return /^[a-z0-9/_-]{1,64}$/i.test(trimmed) ? trimmed : "catalog";
}

export async function POST(request: NextRequest) {
  // Sensitive endpoint: rate-limit before any parsing/DB work. Runs ahead of
  // the try/catch below, whose fallback intentionally returns 200 on errors —
  // a 429 must not be swallowed by that fallback.
  const rateLimit = await checkRateLimit(request, RATE_LIMITS.inquiriesWhatsapp);
  if (!rateLimit.success) return tooManyRequests(rateLimit);

  try {
    let body: { productId?: string; productSlug?: string; sourcePage?: string };
    try {
      body = await request.json();
    } catch {
      return applyRateLimitHeaders(NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }), rateLimit);
    }

    const { productId, productSlug } = body;
    const productKey = productId ?? "";
    const sourcePage = safeSourcePage(body.sourcePage);

    if (!productId && !productSlug) {
      return applyRateLimitHeaders(
        NextResponse.json({ error: "productId or productSlug is required" }, { status: 400 }),
        rateLimit,
      );
    }

    const db = getDb();

    const publicProductWhere = { status: "ACTIVE", category: { isActive: true }, brand: { isActive: true } } as const;
    const productSelect = {
      id: true,
      name: true,
      sku: true,
      slug: true,
      publicPrice: true,
      retailPrice: true,
      stockStatus: true,
      stockQuantity: true,
      categoryId: true,
    } as const;

    const product = productSlug
      ? await db.product.findFirst({
          where: { slug: productSlug, ...publicProductWhere },
          select: productSelect,
        })
      : await db.product.findFirst({
          where: {
            ...publicProductWhere,
            OR: [{ slug: productKey }, { sku: productKey }],
          },
          select: productSelect,
        });

    if (!product) {
      const trackingEnabled = await isFeatureEnabled("enable_inquiry_tracking").catch(() => false);
      if (trackingEnabled) {
        const session = await auth.api
          .getSession({
            headers: request.headers,
          })
          .catch(() => null);

        const resolvedId = productSlug ?? productId ?? "unknown";

        await db.whatsappInquiryLog.create({
          data: {
            userId: session?.user?.id ?? null,
            productId: resolvedId,
            customerName: session?.user?.name ?? null,
            message: `Failed inquiry: product not found (${resolvedId})`,
            waUrl: "",
            sourcePage,
            status: "NEW",
          },
        }).catch(() => {});
      }

      return applyRateLimitHeaders(NextResponse.json({ error: "Product not found" }, { status: 404 }), rateLimit);
    }

    const currentUser = await getCurrentUser();

    // Admin/Super Admin must not use public inquiry flow
    if (currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN") {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "Admin tidak dapat menggunakan inquiry publik. Gunakan dashboard." },
          { status: 403 },
        ),
        rateLimit,
      );
    }

    const user = currentUser ? {
      role: currentUser.role,
      retailStatus: currentUser.retailStatus,
    } : undefined;

    const [
      retailPriceEnabled,
      publicVoucherEnabled,
      retailVoucherEnabled,
      trackingEnabled,
      flashSaleEnabled,
    ] = await Promise.all([
      isFeatureEnabled("enable_retail_price").catch(() => false),
      isFeatureEnabled("enable_public_voucher").catch(() => false),
      isFeatureEnabled("enable_retail_voucher").catch(() => false),
      isFeatureEnabled("enable_inquiry_tracking").catch(() => false),
      isFeatureEnabled("enable_flash_sale").catch(() => false),
    ]);

    const showRetailPrice = canSeeRetailPrice(user, retailPriceEnabled);
    const canSeeRetailVouchers = canUseRetailVoucher(user);

    const [vouchers, activeFlashSale] = await Promise.all([
      db.voucher.findMany({
        where: {
          isActive: true,
          status: "ACTIVE",
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
        },
        include: {
          categories: { select: { id: true } },
          products: { select: { productId: true } },
        },
      }),
      flashSaleEnabled
        ? db.flashSaleProduct.findFirst({
            where: {
              productId: product.id,
              flashSale: {
                isActive: true,
                startsAt: { lte: new Date() },
                endsAt: { gte: new Date() },
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    const priceForMinimum =
      showRetailPrice && product.retailPrice ? Number(product.retailPrice) : Number(product.publicPrice);
    const applicableVouchers = getEligibleProductVouchers(product, vouchers, {
      publicVoucherEnabled,
      retailVoucherEnabled,
      canSeeRetailVoucher: canSeeRetailVouchers,
      priceForMinimum,
      hasActiveFlashSale: Boolean(activeFlashSale),
    });
    const applicableIds = applicableVouchers.map((v) => v.id);

    let voucherInfo: string | undefined;

    if (currentUser) {
      const claimedVouchers = await db.voucherClaim.findMany({
        where: {
          userId: currentUser.id,
          voucherId: { in: applicableIds },
          status: "CLAIMED",
        },
        include: { voucher: true },
      });

      if (claimedVouchers.length > 0) {
        const lines = claimedVouchers.map((cv) => {
          const label = voucherLabel(cv.voucher);
          return `Voucher: ${cv.voucher.code} - ${cv.voucher.title} (${label})`;
        });
        voucherInfo = lines.join("\n");
      } else if (applicableVouchers.length > 0) {
        voucherInfo = "Voucher tersedia. Klaim voucher sebelum menghubungi admin.";
      }
    } else if (applicableVouchers.length > 0) {
      voucherInfo = "Voucher tersedia. Klaim voucher sebelum menghubungi admin.";
    }

    // Never the request origin on its own: behind the Hostinger proxy that is
    // the bind address (0.0.0.0:3000) and produces links nobody can open.
    const baseUrl = getPublicBaseUrl(request.nextUrl.origin);
    const productLink = buildProductUrl(product, baseUrl);

    const message = buildInquiryMessage({
      product,
      user,
      showRetailPrice,
      productLink,
      voucherInfo,
    });

    const whatsappNumber = await resolveStoreWhatsappNumber(db);

    const waUrl = buildWhatsappUrl({
      message,
      whatsappNumber,
    });

    await db.product.update({
      where: { id: product.id },
      data: { inquiryCount: { increment: 1 } },
    }).catch(() => {});

    await trackAnalyticsEvent({
      type: AnalyticsEventType.WHATSAPP_CLICK,
      path: productLink,
      productId: product.id,
      productName: product.name,
      userId: currentUser?.id,
      metadata: {
        sourcePage,
        showRetailPrice,
        voucherCount: applicableVouchers.length,
      },
    });

    if (trackingEnabled) {
      const resolvedUserId = currentUser?.id ?? null;
      const resolvedName = currentUser?.name ?? null;

      await db.whatsappInquiryLog.create({
        data: {
          userId: resolvedUserId,
          productId: product.id,
          customerName: resolvedName,
          whatsappNumber,
          message,
          waUrl,
          sourcePage,
          status: "NEW",
        },
      }).catch(() => {});
    }

    return applyRateLimitHeaders(NextResponse.json({ waUrl }), rateLimit);
  } catch (error) {
    logger.error({ err: error, route: "inquiries/whatsapp" }, "Inquiry endpoint error");
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 }),
      rateLimit,
    );
  }
}
