import Link from "next/link";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import ProductFormClient from "../../ProductFormClient";

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, getAdminSession()]);

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
  const [product, categories, brands] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
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

  if (!product) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
        <section className="mx-auto max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Produk tidak ditemukan</p>
          <Link href="/admin/products" className="mt-4 block text-center text-brand-primary">
            Kembali ke Daftar Produk
          </Link>
        </section>
      </main>
    );
  }

  const serializedProduct = {
    ...product,
    costPrice: product.costPrice?.toString() ?? "",
    publicMarginValue: product.publicMarginValue?.toString() ?? "",
    retailMarginValue: product.retailMarginValue?.toString() ?? "",
    publicPrice: product.publicPrice?.toString() ?? "",
    retailPrice: product.retailPrice?.toString() ?? "",
    marginPercent: product.marginPercent?.toString() ?? null,
    createdAt: product.createdAt?.toISOString() ?? null,
    updatedAt: product.updatedAt?.toISOString() ?? null,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
      sortOrder: image.sortOrder,
    })),
  };

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
      <section className="mx-auto max-w-5xl rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 border-b border-brand-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit Produk</h1>
            <p className="mt-2 text-sm text-brand-muted">
              Perbarui data produk, harga, margin, stok, gambar, dan status publikasi.
            </p>
          </div>
          <Link
            href="/admin/products"
            className="rounded-xl border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary"
          >
            Kembali
          </Link>
        </div>

        <ProductFormClient
          mode="edit"
          categories={categories}
          brands={brands}
          product={serializedProduct}
        />
      </section>
    </main>
  );
}
