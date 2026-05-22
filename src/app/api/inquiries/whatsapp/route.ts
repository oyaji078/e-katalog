import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { canSeeRetailPrice, getApplicableVouchers, voucherLabel } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  buildInquiryMessage,
  buildProductUrl,
  buildWhatsappUrl,
  resolveStoreWhatsappNumber,
} from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    let body: { productId?: string; productSlug?: string; sourcePage?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { productId, productSlug, sourcePage = "catalog" } = body;

    if (!productId && !productSlug) {
      return NextResponse.json(
        { error: "productId or productSlug is required" },
        { status: 400 },
      );
    }

    const db = getDb();

    // Fetch product by slug or ID
    const product = productSlug
      ? await db.product.findUnique({
          where: { slug: productSlug },
          select: {
            id: true,
            name: true,
            sku: true,
            slug: true,
            publicPrice: true,
            retailPrice: true,
            stockStatus: true,
            stockQuantity: true,
            categoryId: true,
          },
        })
      : await db.product.findUnique({
          where: { id: productId },
          select: {
            id: true,
            name: true,
            sku: true,
            slug: true,
            publicPrice: true,
            retailPrice: true,
            stockStatus: true,
            stockQuantity: true,
            categoryId: true,
          },
        });

    if (!product) {
      // Log failed inquiry if tracking enabled
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
        }).catch(() => {
          // Silently fail logging
        });
      }

      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    // Get user session
    const session = await auth.api
      .getSession({
        headers: request.headers,
      })
      .catch(() => null);

    const user = session?.user ? {
      role: session.user.role,
      retailStatus: session.user.retailStatus,
    } : undefined;

    // Check feature flags
    const [retailPriceEnabled, trackingEnabled] = await Promise.all([
      isFeatureEnabled("enable_retail_price").catch(() => false),
      isFeatureEnabled("enable_inquiry_tracking").catch(() => false),
    ]);

    // Determine if user can see retail price
    const showRetailPrice = canSeeRetailPrice(user, retailPriceEnabled);

    // Fetch applicable vouchers
    const vouchers = await db.voucher.findMany({
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
    });

    const applicableVouchers = getApplicableVouchers(product, vouchers);

    // Build voucher info
    let voucherInfo: string | undefined;
    if (applicableVouchers.length > 0) {
      const voucherLines = applicableVouchers.map((v) => {
        const label = voucherLabel(v);
        return `Voucher: ${v.title} (${label})`;
      });
      voucherInfo = voucherLines.join("\n");
    }

    // Build product URL (use configured base URL if available)
    const baseUrl = request.nextUrl.origin;
    const productLink = buildProductUrl(product, baseUrl);

    // Build inquiry message
    const message = buildInquiryMessage({
      product,
      user,
      showRetailPrice,
      productLink,
      voucherInfo,
    });

    // Resolve WhatsApp number from StoreSetting, fallback to env
    const whatsappNumber = await resolveStoreWhatsappNumber(db);

    // Build WhatsApp URL
    const waUrl = buildWhatsappUrl({
      message,
      whatsappNumber,
    });

    // Log inquiry if tracking enabled
    if (trackingEnabled) {
      const resolvedUserId = session?.user?.id ?? null;
      const resolvedName = session?.user?.name ?? null;

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
      }).catch(() => {
        // Silently fail logging to not break the flow
      });
    }

    return NextResponse.json({ waUrl });
  } catch {
    // Fallback on error
    const fallbackNumber = await resolveStoreWhatsappNumber(getDb()).catch(() => undefined);
    const fallbackMessage = "Halo Admin, saya tertarik dengan produk dari katalog.";
    const fallbackUrl = buildWhatsappUrl({
      message: fallbackMessage,
      whatsappNumber: fallbackNumber,
    });
    return NextResponse.json({ waUrl: fallbackUrl });
  }
}
