import Link from "next/link";

import { requireAdminSession } from "@/lib/admin-auth";
import BannerFormClient from "../BannerFormClient";

export const dynamic = "force-dynamic";

export default async function NewBannerPage() {
  await requireAdminSession("/admin/promo-banners/new");

  return (
    <main className="min-h-screen bg-soft-bg text-text-dark">
      <section className="mx-auto max-w-3xl rounded-lg border border-border-gray bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-border-gray pb-5">
          <div>
            <h1 className="text-2xl font-bold">Tambah Banner Promo</h1>
            <p className="mt-1 text-sm text-text-muted">Buat banner promo baru untuk halaman utama.</p>
          </div>
          <Link href="/admin/promo-banners" className="rounded-lg border border-primary-maroon px-4 py-2 text-sm font-semibold text-primary-maroon">Kembali</Link>
        </div>
        <BannerFormClient mode="create" />
      </section>
    </main>
  );
}
