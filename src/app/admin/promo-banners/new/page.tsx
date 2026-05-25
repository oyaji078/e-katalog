import Link from "next/link";

import { requireAdminSession } from "@/lib/admin-auth";
import { serializeBannerVoucher } from "@/lib/banner-voucher";
import { getDb } from "@/lib/db";
import BannerFormClient from "../BannerFormClient";

export const dynamic = "force-dynamic";

export default async function NewBannerPage() {
  await requireAdminSession("/admin/promo-banners/new");
  const db = getDb();
  const vouchers = await db.voucher.findMany({
    orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <section className="mx-auto max-w-3xl rounded-lg border border-brand-border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-brand-border pb-5">
          <div>
            <h1 className="text-2xl font-bold">Tambah Banner Promo</h1>
            <p className="mt-1 text-sm text-brand-muted">Buat banner promo baru untuk halaman utama.</p>
          </div>
          <Link href="/admin/promo-banners" className="rounded-lg border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary">Kembali</Link>
        </div>
        <BannerFormClient mode="create" vouchers={vouchers.map(serializeBannerVoucher)} />
      </section>
    </main>
  );
}
