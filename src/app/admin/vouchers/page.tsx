import Link from "next/link";

import { formatRupiah, voucherLabel } from "@/lib/catalog";
import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import VoucherDisableFormClient from "./VoucherDisableFormClient";

export const dynamic = "force-dynamic";

export default async function AdminVouchersPage() {
  const session = await getAdminSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
        <section className="mx-auto max-w-md rounded-lg border border-border-gray bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Unauthorized access</p>
          <Link href="/" className="mt-4 block text-center text-primary-maroon">
            Go to Homepage
          </Link>
        </section>
      </main>
    );
  }

  const vouchers = await getDb().voucher.findMany({
    include: {
      categories: true,
      products: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Vouchers</h1>
            <p className="mt-2 text-sm text-text-muted">
              Manage public and retail voucher information shown before WhatsApp inquiry.
            </p>
          </div>
          <Link
            href="/admin/vouchers/new"
            className="rounded-md bg-primary-maroon px-4 py-2 text-sm font-bold text-white"
          >
            Add Voucher
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-border-gray bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-gray text-sm">
              <thead className="bg-primary-maroon/5 text-xs uppercase tracking-wide text-primary-maroon">
                <tr>
                  <th className="px-4 py-3 text-left">Voucher</th>
                  <th className="px-4 py-3 text-left">Audience</th>
                  <th className="px-4 py-3 text-left">Discount</th>
                  <th className="px-4 py-3 text-left">Minimum</th>
                  <th className="px-4 py-3 text-left">Scope</th>
                  <th className="px-4 py-3 text-left">Window</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {vouchers.map((voucher) => (
                  <tr key={voucher.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-dark">{voucher.title}</p>
                      <p className="font-mono text-xs text-text-muted">{voucher.code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          voucher.audience === "RETAIL"
                            ? "bg-soft-teal/20 text-primary-maroon"
                            : "bg-accent-rose/10 text-accent-rose"
                        }`}
                      >
                        {voucher.audience === "RETAIL" ? "Retail" : "Public"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-accent-rose">
                      {voucherLabel(voucher)}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {voucher.minimumPurchase ? formatRupiah(voucher.minimumPurchase) : "-"}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {voucher.scope}
                      {voucher.scope === "PRODUCTS" ? ` (${voucher.products.length})` : ""}
                      {voucher.scope === "CATEGORIES" ? ` (${voucher.categories.length})` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {dateLabel(voucher.startsAt)} - {dateLabel(voucher.endsAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          voucher.isActive && voucher.status === "ACTIVE"
                            ? "bg-success/20 text-success"
                            : "bg-text-muted/10 text-text-muted"
                        }`}
                      >
                        {voucher.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/vouchers/${voucher.id}/edit`}
                          className="text-xs font-bold text-primary-maroon"
                        >
                          Edit
                        </Link>
                        <VoucherDisableFormClient voucherId={voucher.id} />
                      </div>
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-text-muted">
                      No vouchers found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
