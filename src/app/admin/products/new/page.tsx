import Link from "next/link";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import ProductFormClient from "../ProductFormClient";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  const session = await getAdminSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
        <section className="mx-auto max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Unauthorized access</p>
          <Link href="/" className="mt-4 block text-center text-brand-primary">
            Go to Homepage
          </Link>
        </section>
      </main>
    );
  }

  const db = getDb();
  const [categories, brands] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
      <section className="mx-auto max-w-5xl rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 border-b border-brand-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tambah Produk Baru</h1>
            <p className="mt-2 text-sm text-brand-muted">
              Kelola data produk, harga, margin, stok, gambar, dan status publikasi.
            </p>
          </div>
          <Link
            href="/admin/products"
            className="rounded-xl border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary"
          >
            Kembali
          </Link>
        </div>

        <ProductFormClient mode="create" categories={categories} brands={brands} />
      </section>
    </main>
  );
}
