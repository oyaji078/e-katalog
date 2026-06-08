import DashboardTabs from "./DashboardTabs";

import { AnalyticsEventType } from "@/generated/prisma/client";
import {
  getEventCountBetween,
  getInteractionTrend,
  getTopProductsBetween,
} from "@/lib/analytics";
import { requireAdmin } from "@/lib/access-control";
import { resolveDashboardRange } from "@/lib/dashboard-range";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  await requireAdmin();
  const db = getDb();
  const now = new Date();
  const params = (await searchParams) ?? {};
  const range = resolveDashboardRange(params, now);

  const [
    totalProducts,
    totalInquiries,
    pendingRetail,
    activeRetail,
    registeredRetail,
    activeVouchers,
    lowStockProducts,
    totalCategories,
    totalBrands,
    recentProducts,
    recentInquiries,
    visitsInRange,
    productViewsInRange,
    whatsappClicksInRange,
    inquiriesInRange,
    retailRegistrationsInRange,
    activeTokens,
    usedTokensInRange,
    trend,
    topViewedProducts,
    topWhatsappProducts,
  ] = await Promise.all([
    db.product.count({ where: { status: "ACTIVE" } }),
    db.whatsappInquiryLog.count(),
    db.user.count({ where: { role: "USER", retailStatus: "PENDING_RETAIL" } }),
    db.user.count({ where: { role: "USER", retailStatus: "RETAIL_ACTIVE" } }),
    db.user.count({ where: { role: "USER", retailStatus: "REGISTERED" } }),
    db.voucher.count({
      where: { isActive: true, status: "ACTIVE", startsAt: { lte: now }, endsAt: { gte: now } },
    }),
    db.product.count({ where: { status: "ACTIVE", stockStatus: "LOW_STOCK" } }),
    db.category.count({ where: { isActive: true } }),
    db.brand.count({ where: { isActive: true } }),
    db.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        stockStatus: true,
      },
    }),
    db.whatsappInquiryLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        customerName: true,
        sourcePage: true,
        status: true,
        createdAt: true,
      },
    }),
    getEventCountBetween(AnalyticsEventType.PAGE_VIEW, range.start, range.end),
    getEventCountBetween(AnalyticsEventType.PRODUCT_VIEW, range.start, range.end),
    getEventCountBetween(AnalyticsEventType.WHATSAPP_CLICK, range.start, range.end),
    db.whatsappInquiryLog.count({
      where: { createdAt: { gte: range.start, lt: range.end } },
    }),
    getEventCountBetween(AnalyticsEventType.RETAIL_REGISTER, range.start, range.end),
    db.retailToken.count({
      where: { status: "ACTIVE", usedAt: null, revokedAt: null, expiresAt: { gt: now } },
    }),
    db.retailToken.count({
      where: { status: "USED", usedAt: { gte: range.start, lt: range.end } },
    }),
    getInteractionTrend(range.start, range.end, range.interval),
    getTopProductsBetween(AnalyticsEventType.PRODUCT_VIEW, range.start, range.end, 5),
    getTopProductsBetween(AnalyticsEventType.WHATSAPP_CLICK, range.start, range.end, 5),
  ]);

  return (
    <div>
      <DashboardTabs
        range={{
          key: range.key,
          label: range.label,
          startInput: range.startInput,
          endInput: range.endInput,
        }}
        kpi={{
          totalProducts,
          totalInquiries,
          pendingRetail,
          activeRetail,
          registeredRetail,
          activeVouchers,
          lowStockProducts,
          totalCategories,
          totalBrands,
        }}
        analytics={{
          visits: visitsInRange,
          productViews: productViewsInRange,
          whatsappClicks: whatsappClicksInRange,
          inquiries: inquiriesInRange,
          retailRegistrations: retailRegistrationsInRange,
          activeTokens,
          usedTokens: usedTokensInRange,
          trend: trend.map((point) => ({
            label: point.label,
            visits: point.visits,
            whatsapp: point.whatsapp,
            inquiries: point.inquiries,
          })),
          topViewedProducts: topViewedProducts.map((product) => ({
            id: product.productId,
            name: product.productName ?? product.productId,
            count: product.count,
            href: `/admin/products/${product.productId}/edit`,
          })),
          topWhatsappProducts: topWhatsappProducts.map((product) => ({
            id: product.productId,
            name: product.productName ?? product.productId,
            count: product.count,
            href: `/admin/products/${product.productId}/edit`,
          })),
        }}
        recentProducts={recentProducts.map((product) => ({
          ...product,
          createdAt: product.createdAt.toISOString(),
        }))}
        recentInquiries={recentInquiries.map((inquiry) => ({
          ...inquiry,
          createdAt: inquiry.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
