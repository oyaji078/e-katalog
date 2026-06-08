import Link from "next/link";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import AdminProductsPageClient from "./AdminProductsPageClient";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 50;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getAdminSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
        <section className="mx-auto max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Tidak memiliki akses</p>
          <Link href="/" className="mt-4 block text-center text-brand-primary">
            Ke Halaman Utama
          </Link>
        </section>
      </main>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const db = getDb();
  const [totalCount, products] = await Promise.all([
    db.product.count(),
    db.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        slug: true,
        primaryImageUrl: true,
        costPrice: true,
        publicPrice: true,
        retailPrice: true,
        stockQuantity: true,
        stockStatus: true,
        status: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: ITEMS_PER_PAGE,
      skip: (page - 1) * ITEMS_PER_PAGE,
    }),
  ]);

  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    slug: p.slug,
    primaryImageUrl: p.primaryImageUrl ?? p.images[0]?.url ?? null,
    costPrice: p.costPrice.toString(),
    publicPrice: p.publicPrice.toString(),
    retailPrice: p.retailPrice?.toString() ?? null,
    stockQuantity: p.stockQuantity,
    stockStatus: p.stockStatus,
    status: p.status,
    category: p.category ? { name: p.category.name } : null,
    brand: p.brand ? { name: p.brand.name } : null,
  }));

  return (
    <AdminProductsPageClient
      products={serialized}
      pagination={{
        page,
        pageSize: ITEMS_PER_PAGE,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE)),
      }}
    />
  );
}
