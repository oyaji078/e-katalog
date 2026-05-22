import Link from "next/link";
import { notFound } from "next/navigation";

import ProductGrid from "@/components/ui/ProductGrid";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { toProductCardProps } from "@/lib/product-card-mapper";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const db = getDb();
  const [session, retailPriceEnabled, publicVoucherEnabled, retailVoucherEnabled] =
    await Promise.all([
      getCurrentSession().catch(() => null),
      isFeatureEnabled("enable_retail_price"),
      isFeatureEnabled("enable_public_voucher"),
      isFeatureEnabled("enable_retail_voucher"),
    ]);

  const category = await db.category.findUnique({
    where: { slug },
  });
  if (!category || !category.isActive) notFound();

  const [products, vouchers] = await Promise.all([
    db.product.findMany({
      where: {
        categoryId: category.id,
        status: "ACTIVE",
      },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
    db.voucher.findMany({
      where: { isActive: true, status: "ACTIVE" },
      include: {
        categories: { select: { id: true } },
        products: { select: { productId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const productCards = products.map((product) =>
    toProductCardProps(product, {
      user: session?.user,
      retailPriceEnabled,
      publicVoucherEnabled,
      retailVoucherEnabled,
      vouchers,
    }),
  );

  return (
    <main className="min-h-screen bg-soft-bg text-text-dark">
      <header className="border-b border-border-gray bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold text-primary-maroon">
            E-Katalog Komputer
          </Link>
          <Link href="/products" className="text-sm font-bold text-primary-maroon">
            Semua produk
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 rounded-lg border border-border-gray bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold">{category.name}</h1>
          {category.description ? (
            <p className="mt-2 text-sm leading-6 text-text-muted">{category.description}</p>
          ) : null}
        </div>
        {productCards.length > 0 ? (
          <ProductGrid products={productCards} columns={4} />
        ) : (
          <div className="rounded-lg border border-border-gray bg-white p-8 text-center text-sm text-text-muted">
            Produk aktif untuk kategori ini belum tersedia.
          </div>
        )}
      </div>
    </main>
  );
}
