import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  canSeeRetailPrice,
  canUseRetailVoucher,
  getApplicableVouchers,
  getVisibleVouchers,
  voucherLabel,
} from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getCurrentUser } from "@/lib/session";
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

    const { productId, productSlug } = body;
    const sourcePage = "catalog";

    if (!productId && !productSlug) {
      return NextResponse.json(
        { error: "productId or productSlug is required" },
        { status: 400 },
      );
    }

    const db = getDb();

    const product = productSlug
      ? await db.product.findFirst({
          where: { slug: productSlug, status: "ACTIVE" },
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
      : await db.product.findFirst({
          where: { id: productId, status: "ACTIVE" },
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

      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    const currentUser = await getCurrentUser();
    const user = currentUser ? {
      role: currentUser.role,
      retailStatus: currentUser.retailStatus,
    } : undefined;

    const [
      retailPriceEnabled,
      publicVoucherEnabled,
      retailVoucherEnabled,
      trackingEnabled,
    ] = await Promise.all([
      isFeatureEnabled("enable_retail_price").catch(() => false),
      isFeatureEnabled("enable_public_voucher").catch(() => false),
      isFeatureEnabled("enable_retail_voucher").catch(() => false),
      isFeatureEnabled("enable_inquiry_tracking").catch(() => false),
    ]);

    const showRetailPrice = canSeeRetailPrice(user, retailPriceEnabled);
    const canSeeRetailVouchers = canUseRetailVoucher(user);

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

    const applicableVouchers = getVisibleVouchers(getApplicableVouchers(product, vouchers), {
      publicVoucherEnabled,
      retailVoucherEnabled,
      canSeeRetail: canSeeRetailVouchers,
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

    const baseUrl = request.nextUrl.origin;
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

    return NextResponse.json({ waUrl });
  } catch {
    const fallbackNumber = await resolveStoreWhatsappNumber(getDb()).catch(() => undefined);
    const fallbackMessage = "Halo Admin, saya tertarik dengan produk dari katalog.";
    const fallbackUrl = buildWhatsappUrl({
      message: fallbackMessage,
      whatsappNumber: fallbackNumber,
    });
    return NextResponse.json({ waUrl: fallbackUrl });
  }
}
