import { notFound } from "next/navigation";

import PublicNavbar from "@/components/layout/PublicNavbar";
import ProductGrid from "@/components/ui/ProductGrid";
import PublicFooter from "@/components/ui/PublicFooter";
import { canSeeRetailPrice, productCardSelect, voucherWithScopeSelect } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { buildActiveFlashSaleMap, getFlashSaleDisplayForViewer } from "@/lib/flash-sale";
import { toProductCardProps } from "@/lib/product-card-mapper";
import { getCurrentUser } from "@/lib/session";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { getStoreWhatsappNumberFromDB } from "@/lib/store-settings";
import { buildWhatsappUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const db = getDb();
  const now = new Date();
  const [user, retailPriceEnabled, publicVoucherEnabled, retailVoucherEnabled, flashSaleEnabled, settings, waNumber] =
    await Promise.all([
      getCurrentUser().catch(() => null),
      isFeatureEnabled("enable_retail_price"),
      isFeatureEnabled("enable_public_voucher"),
      isFeatureEnabled("enable_retail_voucher"),
      isFeatureEnabled("enable_flash_sale"),
      getPublicSiteSettings(),
      getStoreWhatsappNumberFromDB(),
    ]);

  const category = await db.category.findUnique({
    where: { slug },
  });
  if (!category || !category.isActive) notFound();

  const [products, vouchers, activeFlashSaleProducts, topCategories] = await Promise.all([
    db.product.findMany({
      where: {
        categoryId: category.id,
        status: "ACTIVE",
        brand: { isActive: true },
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
      where: {
        isActive: true,
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      select: voucherWithScopeSelect,
      orderBy: { createdAt: "desc" },
    }),
    // Flash-sale pricing is only shown when the global enable_flash_sale flag is
    // on — otherwise this query is skipped and no flash display is applied.
    flashSaleEnabled
      ? db.flashSaleProduct.findMany({
          where: {
            flashSale: {
              isActive: true,
              startsAt: { lte: now },
              endsAt: { gte: now },
            },
          },
          select: {
            productId: true,
            flashSalePublicPrice: true,
            flashSaleRetailPrice: true,
            flashSaleStock: true,
            flashSale: { select: { showForPublic: true, showForRetail: true } },
          },
        })
      : Promise.resolve([]),
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
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

  const generalWaUrl = buildWhatsappUrl({
    message: `Halo Admin, saya ingin bertanya tentang produk kategori ${category.name}.`,
    whatsappNumber: waNumber,
  });

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--color-page)] text-[var(--color-text)]">
      <PublicNavbar
        whatsappUrl={generalWaUrl}
        session={user}
        announcementText={settings.announcementEnabled ? settings.announcementText : ""}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
            Kategori
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-[var(--color-text)]">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              {category.description}
            </p>
          ) : null}
        </div>
        {productCards.length > 0 ? (
          <ProductGrid products={productCards} columns={4} />
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-text-muted)]">
            Produk aktif untuk kategori ini belum tersedia.
          </div>
        )}
      </div>

      <PublicFooter
        whatsappUrl={generalWaUrl}
        storeName={settings.storeName}
        storeAddress={settings.address}
        publicVoucherEnabled={publicVoucherEnabled}
        topCategories={topCategories}
      />
    </main>
  );
}
