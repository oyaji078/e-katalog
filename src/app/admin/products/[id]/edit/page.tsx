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
      <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
        <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Unauthorized access</p>
          <Link href="/" className="mt-4 block text-center text-primary-maroon">
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
      <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
        <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Produk tidak ditemukan</p>
          <Link href="/admin/products" className="mt-4 block text-center text-primary-maroon">
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
      url: image.url,
    })),
  };

  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <section className="mx-auto max-w-5xl rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 border-b border-border-gray pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit Produk</h1>
            <p className="mt-2 text-sm text-text-muted">
              Perbarui data produk, harga, margin, stok, gambar, dan status publikasi.
            </p>
          </div>
          <Link
            href="/admin/products"
            className="rounded-xl border border-primary-maroon px-4 py-2 text-sm font-semibold text-primary-maroon"
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
