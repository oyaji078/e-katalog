import Link from "next/link";

import { getDb } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

import FlashSaleActions from "./FlashSaleActions";

export const dynamic = "force-dynamic";

export default async function FlashSalesPage() {
  await requireAdminSession();
  const db = getDb();

  const flashSales = await db.flashSale.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <main>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Flash Sale</h1>
          <p className="mt-1 text-sm text-brand-muted">Kelola produk flash sale dengan harga dan stok khusus.</p>
        </div>
        <Link
          href="/admin/flash-sales/new"
          className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-primary/80"
        >
          + Flash Sale Baru
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg text-left text-xs text-brand-muted">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Mulai</th>
              <th className="px-4 py-3 font-medium">Selesai</th>
              <th className="px-4 py-3 font-medium">Produk</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {flashSales.map((fs) => {
              const now = new Date();
              const isLive = fs.isActive && fs.startsAt <= now && fs.endsAt >= now;
              const isScheduled = fs.isActive && fs.startsAt > now;
              const isEnded = !fs.isActive || fs.endsAt < now;

              return (
                <tr key={fs.id} className="border-b border-brand-border/50">
                  <td className="px-4 py-3 font-medium text-brand-text">{fs.name}</td>
                  <td className="px-4 py-3 text-brand-muted">{fs.startsAt.toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3 text-brand-muted">{fs.endsAt.toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3 text-brand-muted">{fs._count.products} produk</td>
                  <td className="px-4 py-3">
                    {isLive ? (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">Aktif</span>
                    ) : isScheduled ? (
                      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">Terjadwal</span>
                    ) : (
                      <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-semibold text-danger">{isEnded ? "Berakhir" : "Nonaktif"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/flash-sales/${fs.id}/edit`}
                        className="text-xs font-semibold text-brand-primary hover:underline"
                      >
                        Edit
                      </Link>
                      <FlashSaleActions flashSaleId={fs.id} isActive={fs.isActive} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {flashSales.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-brand-muted">
                  Belum ada flash sale.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
