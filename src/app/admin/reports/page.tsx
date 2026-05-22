import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireAdmin();
  const db = getDb();

  const totalProducts = await db.product.count({ where: { status: "ACTIVE" } });
  const totalInquiries = await db.whatsappInquiryLog.count();
  const totalVouchers = await db.voucher.count({ where: { isActive: true } });
  const totalRetailUsers = await db.user.count({
    where: { retailStatus: { in: ["RETAIL_ACTIVE", "PENDING_RETAIL"] } },
  });

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-dark">Reports</h1>
        <p className="mt-1 text-sm text-text-muted">
          Store operational summary and statistics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard label="Active Products" value={totalProducts} />
        <ReportCard label="Total Inquiries" value={totalInquiries} />
        <ReportCard label="Active Vouchers" value={totalVouchers} />
        <ReportCard label="Retail Users" value={totalRetailUsers} />
      </div>

      <div className="mt-6 rounded-lg border border-border-gray bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-text-dark">Report Notes</h2>
        <p className="text-sm text-text-muted">
          Detailed reporting and export functionality can be implemented in a future phase.
          Current metrics are sourced from live database counts.
        </p>
      </div>
    </main>
  );
}

function ReportCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border-gray bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-primary-maroon">{value}</p>
    </div>
  );
}
