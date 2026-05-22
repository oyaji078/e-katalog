import Link from "next/link";

import VoucherCard from "@/components/ui/VoucherCard";
import { canSeeRetailPrice, formatRupiah, getVisibleVouchers, voucherLabel } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function VouchersPage() {
  const db = getDb();
  const [session, retailPriceEnabled, publicVoucherEnabled, retailVoucherEnabled] =
    await Promise.all([
      getCurrentSession().catch(() => null),
      isFeatureEnabled("enable_retail_price"),
      isFeatureEnabled("enable_public_voucher"),
      isFeatureEnabled("enable_retail_voucher"),
    ]);
  const canSeeRetail = canSeeRetailPrice(session?.user, retailPriceEnabled);

  const vouchers = await db.voucher.findMany({
    where: {
      isActive: true,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });
  const visibleVouchers = getVisibleVouchers(vouchers, {
    publicVoucherEnabled,
    retailVoucherEnabled,
    canSeeRetail,
  });

  return (
    <main className="min-h-screen bg-soft-bg text-text-dark">
      <header className="border-b border-border-gray bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold text-primary-maroon">
            E-Katalog Komputer
          </Link>
          <Link href="/products" className="text-sm font-bold text-primary-maroon">
            Belanja katalog
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 rounded-lg border border-border-gray bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold">Voucher Katalog</h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Voucher hanya sebagai informasi sebelum inquiry WhatsApp. Tidak ada checkout,
            pembayaran, atau pengiriman di aplikasi ini.
          </p>
        </div>

        {visibleVouchers.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visibleVouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                title={voucher.title}
                description={voucher.description ?? undefined}
                discountLabel={voucherLabel(voucher)}
                minimumPurchase={
                  voucher.minimumPurchase ? formatRupiah(voucher.minimumPurchase) : undefined
                }
                audience={voucher.audience}
                isActive={voucher.isActive}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border-gray bg-white p-8 text-center text-sm text-text-muted">
            Voucher yang dapat ditampilkan belum tersedia.
          </div>
        )}

        {!canSeeRetail && retailVoucherEnabled ? (
          <div className="mt-6 rounded-lg border border-soft-teal/30 bg-soft-teal/10 p-4 text-sm text-primary-maroon">
            Voucher retail tersedia setelah akun retail aktif menggunakan token dari admin.
          </div>
        ) : null}
      </div>
    </main>
  );
}
