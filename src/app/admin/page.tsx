import Link from "next/link";

import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const role = await requireAdmin();
  const db = getDb();

  const [
    totalProducts,
    totalCategories,
    totalBrands,
    activeVouchers,
    pendingRetail,
    totalInquiries,
    recentProducts,
    lowStockProducts,
    recentInquiries,
  ] = await Promise.all([
    db.product.count({ where: { status: "ACTIVE" } }),
    db.category.count({ where: { isActive: true } }),
    db.brand.count({ where: { isActive: true } }),
    db.voucher.count({ where: { isActive: true, status: "ACTIVE" } }),
    db.user.count({ where: { retailStatus: "PENDING_RETAIL" } }),
    db.whatsappInquiryLog.count(),
    db.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, createdAt: true, stockStatus: true },
    }),
    db.product.count({
      where: { status: "ACTIVE", stockStatus: "LOW_STOCK" },
    }),
    db.whatsappInquiryLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, customerName: true, sourcePage: true, status: true, createdAt: true },
    }),
  ]);

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold text-brand-text">Dashboard Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <MetricCard
          label="Active Products"
          value={totalProducts}
          href="/admin/products"
          color="text-brand-primary"
        />
        <MetricCard
          label="Categories"
          value={totalCategories}
          href="/admin/categories"
          color="text-brand-secondary"
        />
        <MetricCard
          label="Brands"
          value={totalBrands}
          href="/admin/brands"
          color="text-brand-accent"
        />
        <MetricCard
          label="Active Vouchers"
          value={activeVouchers}
          href="/admin/vouchers"
          color="text-brand-primary"
        />
        <MetricCard
          label="Pending Retail"
          value={pendingRetail}
          href="/admin/retail-users"
          color="text-warning"
        />
        <MetricCard
          label="Low Stock"
          value={lowStockProducts}
          href="/admin/products"
          color="text-danger"
        />
        <MetricCard
          label="WhatsApp Inquiries"
          value={totalInquiries}
          href="/admin/inquiries"
          color="text-brand-secondary"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-text">Recent Products</h2>
            <Link href="/admin/products" className="text-sm font-semibold text-brand-primary">
              View all
            </Link>
          </div>
          {recentProducts.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Stock</th>
                  <th className="pb-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((p) => (
                  <tr key={p.id} className="border-b border-brand-border/50">
                    <td className="py-2 text-brand-text">{p.name}</td>
                    <td className="py-2">
                      <StockBadge status={p.stockStatus} />
                    </td>
                    <td className="py-2 text-brand-muted">
                      {new Date(p.createdAt).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-brand-muted">No products yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-text">Recent Inquiries</h2>
            <Link href="/admin/inquiries" className="text-sm font-semibold text-brand-primary">
              View all
            </Link>
          </div>
          {recentInquiries.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-xs text-brand-muted">
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentInquiries.map((inq) => (
                  <tr key={inq.id} className="border-b border-brand-border/50">
                    <td className="py-2 text-brand-text">{inq.customerName ?? "Guest"}</td>
                    <td className="py-2 text-brand-muted">{inq.sourcePage ?? "-"}</td>
                    <td className="py-2">
                      <span className="rounded-full bg-brand-secondary/15 px-2 py-0.5 text-xs font-semibold text-brand-primary">
                        {inq.status}
                      </span>
                    </td>
                    <td className="py-2 text-brand-muted">
                      {new Date(inq.createdAt).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-brand-muted">No inquiries yet.</p>
          )}
        </div>
      </div>

      {role === "super_admin" ? (
        <div className="mt-6 rounded-lg border border-brand-secondary/30 bg-brand-secondary/10 p-4 text-sm text-brand-primary">
          You are logged in as Super Admin. Access the{" "}
          <Link href="/super-admin" className="font-bold underline">
            System Dashboard
          </Link>{" "}
          for system-level management.
        </div>
      ) : null}
    </main>
  );
}

function MetricCard({
  label,
  value,
  href,
  color,
}: {
  label: string;
  value: number;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-brand-border bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <p className="text-xs font-semibold text-brand-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </Link>
  );
}

function StockBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    READY: "bg-success/20 text-success",
    LOW_STOCK: "bg-warning/20 text-warning",
    OUT_OF_STOCK: "bg-danger/20 text-danger",
    PREORDER: "bg-brand-secondary/20 text-brand-primary",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[status] || "bg-brand-border text-brand-muted"}`}
    >
      {status}
    </span>
  );
}
