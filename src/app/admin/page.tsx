import DashboardTabs from "./DashboardTabs";

import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const db = getDb();
  const now = new Date();

  const [
    totalProducts,
    totalInquiries,
    pendingRetail,
    activeVouchers,
    lowStockProducts,
    totalCategories,
    totalBrands,
    recentProducts,
    recentInquiries,
  ] = await Promise.all([
    db.product.count({ where: { status: "ACTIVE" } }),
    db.whatsappInquiryLog.count(),
    db.user.count({ where: { retailStatus: "PENDING_RETAIL" } }),
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
  ]);

  return (
    <div>
      <DashboardTabs
        kpi={{
          totalProducts,
          totalInquiries,
          pendingRetail,
          activeVouchers,
          lowStockProducts,
          totalCategories,
          totalBrands,
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
