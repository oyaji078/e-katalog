import { notFound } from "next/navigation";

import FigmaFooter from "@/components/layout/FigmaFooter";
import ProductGrid from "@/components/ui/ProductGrid";
import FigmaSiteHeader from "@/components/layout/FigmaSiteHeader";
import { canSeeRetailPrice, productCardSelect } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { buildActiveFlashSaleMap, getFlashSaleDisplayForViewer } from "@/lib/flash-sale";
import { toProductCardProps } from "@/lib/product-card-mapper";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const db = getDb();
  const [user, retailPriceEnabled, publicVoucherEnabled, retailVoucherEnabled] =
    await Promise.all([
      getCurrentUser().catch(() => null),
      isFeatureEnabled("enable_retail_price"),
      isFeatureEnabled("enable_public_voucher"),
      isFeatureEnabled("enable_retail_voucher"),
    ]);

  const category = await db.category.findUnique({
    where: { slug },
  });
  if (!category || !category.isActive) notFound();

  const [products, vouchers, activeFlashSaleProducts] = await Promise.all([
    db.product.findMany({
      where: {
        categoryId: category.id,
        status: "ACTIVE",
      },
      select: productCardSelect,
      orderBy: [
        { inquiryCount: "desc" },
        { clickCount: "desc" },
        { viewCount: "desc" },
        { createdAt: "desc" },
      ],
    }),
    db.voucher.findMany({
      where: { isActive: true, status: "ACTIVE" },
      include: {
        categories: { select: { id: true } },
        products: { select: { productId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.flashSaleProduct.findMany({
      where: {
        flashSale: {
          isActive: true,
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
        },
      },
      include: {
        flashSale: { select: { showForPublic: true, showForRetail: true } },
      },
    }),
  ]);

  const showRetailPrice = canSeeRetailPrice(user, retailPriceEnabled);
  const flashSaleMap = buildActiveFlashSaleMap(activeFlashSaleProducts);
  const productCards = products.map((product) => {
    const activeFlashSale = flashSaleMap.get(product.id);
    const flashSaleDisplay = getFlashSaleDisplayForViewer(activeFlashSale, showRetailPrice);

    return toProductCardProps(product, {
      user,
      retailPriceEnabled,
      publicVoucherEnabled,
      retailVoucherEnabled,
      vouchers,
      hasActiveFlashSale: Boolean(activeFlashSale),
      flashSalePrice: flashSaleDisplay?.price,
      flashSaleStock: flashSaleDisplay?.stock,
    });
  });

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <FigmaSiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold">{category.name}</h1>
          {category.description ? (
            <p className="mt-2 text-sm leading-6 text-brand-muted">{category.description}</p>
          ) : null}
        </div>
        {productCards.length > 0 ? (
          <ProductGrid products={productCards} columns={4} />
        ) : (
          <div className="rounded-lg border border-brand-border bg-white p-8 text-center text-sm text-brand-muted">
            Produk aktif untuk kategori ini belum tersedia.
          </div>
        )}
      </div>
      <FigmaFooter />
    </main>
  );
}
