import Link from "next/link";

import { requireAdminSession } from "@/lib/admin-auth";
import HeroBannerFormClient from "../HeroBannerFormClient";

export const dynamic = "force-dynamic";

export default async function NewHeroBannerPage() {
  await requireAdminSession("/admin/hero-banners/new");

  return (
    <main className="min-h-screen bg-soft-bg text-text-dark">
      <section className="mx-auto max-w-3xl rounded-lg border border-border-gray bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-border-gray pb-5">
          <div>
            <h1 className="text-2xl font-bold">Tambah Hero Banner</h1>
            <p className="mt-1 text-sm text-text-muted">Buat hero banner baru untuk halaman utama.</p>
          </div>
          <Link href="/admin/hero-banners" className="rounded-lg border border-primary-maroon px-4 py-2 text-sm font-semibold text-primary-maroon">Kembali</Link>
        </div>
        <HeroBannerFormClient mode="create" />
      </section>
    </main>
  );
}
