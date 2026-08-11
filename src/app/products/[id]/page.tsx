import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import PublicNavbar from "@/components/layout/PublicNavbar";
import ProductGallery from "@/components/ui/ProductGallery";
import ProductGrid from "@/components/ui/ProductGrid";
import ProductTrafficTracker from "@/components/ui/ProductTrafficTracker";
import PublicFooter from "@/components/ui/PublicFooter";
import TabGroup from "@/components/ui/TabGroup";
import WhatsAppInquiryButton from "@/components/ui/WhatsAppInquiryButton";
import {
  canSeeRetailPrice,
  canUseRetailVoucher,
  formatRupiah,
  getEligibleProductVouchers,
  productBadge,
  productCardSelect,
  productDetailSelect,
  safeImageSrc,
  voucherWithScopeSelect,
} from "@/lib/catalog";
import { getActiveCategories } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { buildActiveFlashSaleMap, getFlashSaleDisplayForViewer } from "@/lib/flash-sale";
import { toProductCardProps } from "@/lib/product-card-mapper";
import { getCurrentUser } from "@/lib/session";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { getStoreWhatsappNumberFromDB } from "@/lib/store-settings";
import { buildWhatsappUrl } from "@/lib/whatsapp";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const db = getDb();
  const product = await db.product.findFirst({
    where: {
      OR: [{ slug: id }, { sku: id }],
      status: "ACTIVE",
      category: { isActive: true },
      brand: { isActive: true },
    },
    select: {
      name: true,
      slug: true,
      sku: true,
      brand: { select: { name: true } },
      shortSpecification: true,
      description: true,
      primaryImageUrl: true,
    },
  });

  if (!product) {
    return { title: "Produk tidak ditemukan" };
  }

  const description = product.shortSpecification ?? product.description.slice(0, 160);

  return {
    title: `${product.name} - ${product.brand.name}`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.primaryImageUrl ? [{ url: product.primaryImageUrl }] : [],
    },
  };
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams]);
  const returnUrl = safeReturnUrl(firstParam(rawSearchParams.returnUrl), "/products");
  const db = getDb();
  const now = new Date();
  const [user, retailPriceEnabled, publicVoucherEnabled, retailVoucherEnabled, flashSaleEnabled] =
    await Promise.all([
      getCurrentUser().catch(() => null),
      isFeatureEnabled("enable_retail_price"),
      isFeatureEnabled("enable_public_voucher"),
      isFeatureEnabled("enable_retail_voucher"),
      isFeatureEnabled("enable_flash_sale"),
    ]);

  if (user?.role === "ADMIN") redirect("/admin");
  if (user?.role === "SUPER_ADMIN") redirect("/super-admin");

  const publicProductWhere = {
    status: "ACTIVE",
    category: { isActive: true },
    brand: { isActive: true },
  } as const;

  const product = await db.product.findFirst({
    where: {
      OR: [{ slug: id }, { sku: id }],
      ...publicProductWhere,
    },
    select: productDetailSelect,
  });

  if (!product) {
    const legacyProduct = await db.product.findFirst({
      where: { id, ...publicProductWhere },
      select: { slug: true, sku: true },
    });
    if (legacyProduct) {
      const safeId = legacyProduct.slug || legacyProduct.sku;
      if (safeId) {
        redirect(`/products/${safeId}`);
      }
    }
    notFound();
  }

  const [
    vouchers,
    relatedProducts,
    activeFlashSaleProducts,
    settings,
    waNumber,
    allCategories,
  ] = await Promise.all([
    db.voucher.findMany({
      where: {
        isActive: true,
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      select: voucherWithScopeSelect,
      orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
    }),
    db.product.findMany({
      where: {
        status: "ACTIVE",
        categoryId: product.categoryId,
        category: { isActive: true },
        brand: { isActive: true },
        NOT: { id: product.id },
      },
      select: productCardSelect,
      orderBy: [
        { inquiryCount: "desc" },
        { clickCount: "desc" },
        { viewCount: "desc" },
        { createdAt: "desc" },
      ],
      take: 5,
    }),
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
    getPublicSiteSettings(),
    getStoreWhatsappNumberFromDB(),
    getActiveCategories(),
  ]);
  const topCategories = allCategories.slice(0, 8);

  const showRetail = canSeeRetailPrice(user, retailPriceEnabled);
  const canSeeRetailVouchers = canUseRetailVoucher(user);
  const flashSaleMap = buildActiveFlashSaleMap(activeFlashSaleProducts);
  const activeFlashSale = flashSaleMap.get(product.id);
  const flashSaleDisplay = getFlashSaleDisplayForViewer(activeFlashSale, showRetail);
  const priceForMinimum = showRetail && product.retailPrice ? Number(product.retailPrice) : Number(product.publicPrice);
  const visibleVouchers = getEligibleProductVouchers(product, vouchers, {
    publicVoucherEnabled,
    retailVoucherEnabled,
    canSeeRetailVoucher: canSeeRetailVouchers,
    priceForMinimum,
    hasActiveFlashSale: Boolean(activeFlashSale),
  });
  const relatedCards = relatedProducts.map((item) => {
    const relatedFlashSale = flashSaleMap.get(item.id);
    const relatedFlashSaleDisplay = getFlashSaleDisplayForViewer(relatedFlashSale, showRetail);

    return toProductCardProps(item, {
      user,
      retailPriceEnabled,
      publicVoucherEnabled,
      retailVoucherEnabled,
      vouchers,
      hasActiveFlashSale: Boolean(relatedFlashSale),
      flashSalePrice: relatedFlashSaleDisplay?.price,
      flashSaleStock: relatedFlashSaleDisplay?.stock,
    });
  });
  const gallery = uniqueImages(
    [product.primaryImageUrl, ...product.images.map((image) => image.url)].map(safeImageSrc),
  );
  const specs = specRows(product.specifications);
  const publicProductKey = product.slug || product.sku;
  const hasPromo = Boolean(flashSaleDisplay) || visibleVouchers.length > 0;
  const isNewArrival = productBadge(product)?.toUpperCase() === "BARU";
  const generalWaUrl = buildWhatsappUrl({
    message: "Halo Admin, saya ingin bertanya tentang produk di katalog.",
    whatsappNumber: waNumber,
  });

  return (
    <main className="min-h-screen bg-[var(--color-page)]">
      <ProductTrafficTracker productId={publicProductKey} productName={product.name} />
      <PublicNavbar
        whatsappUrl={generalWaUrl}
        session={user}
        announcementText={settings.announcementEnabled ? settings.announcementText : ""}
        announcementSpeed={settings.announcementSpeed}
        announcementLink={settings.announcementEnabled ? settings.announcementLink : null}
        topCategories={topCategories}
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <Link href="/" className="transition-colors hover:text-[var(--color-accent)]">
            Beranda
          </Link>
          <span>/</span>
          <Link href={returnUrl} className="transition-colors hover:text-[var(--color-accent)]">
            Katalog
          </Link>
          <span>/</span>
          <Link
            href={`/categories/${product.category.slug}`}
            className="transition-colors hover:text-[var(--color-accent)]"
          >
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="line-clamp-1 max-w-[200px] font-medium text-[var(--color-text)]">
            {product.name}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_440px]">
          <ProductGallery images={gallery} productName={product.name} />

          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent)]">
                {product.brand.name}
              </span>
              <span className="text-[var(--color-border-strong)]">-</span>
              <span className="text-xs text-[var(--color-text-muted)]">{product.category.name}</span>
            </div>

            <h1 className="text-xl font-bold leading-tight text-[var(--color-text)]">{product.name}</h1>

            <p className="text-xs text-[var(--color-text-muted)]">
              SKU: <span className="font-mono">{product.sku}</span>
            </p>

            <div className="rounded-xl border border-blue-100 bg-[var(--color-accent-soft)] p-4">
              {flashSaleDisplay ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                    {showRetail && product.retailPrice ? "Harga Flash Sale Retail" : "Harga Flash Sale"}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[var(--color-accent)]">
                    {formatRupiah(flashSaleDisplay.price)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)] line-through">
                    {formatRupiah(product.publicPrice)}
                  </p>
                </>
              ) : showRetail && product.retailPrice ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-success)]">
                    Harga Retail
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[var(--color-success)]">
                    {formatRupiah(product.retailPrice)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Harga umum{" "}
                    <span className="font-medium line-through">{formatRupiah(product.publicPrice)}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-[var(--color-accent)]">
                    {formatRupiah(product.publicPrice)}
                  </p>
                  {!showRetail && product.retailPrice ? (
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      Harga retail tersedia untuk{" "}
                      <Link href="/register" className="font-medium text-[var(--color-accent)] hover:underline">
                        pelanggan terdaftar
                      </Link>
                    </p>
                  ) : null}
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <StockChip status={product.stockStatus} />
              {product.warrantyInfo ? (
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-page)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                  Garansi: {product.warrantyInfo}
                </span>
              ) : null}
              {isNewArrival ? (
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  Produk Baru
                </span>
              ) : null}
              {hasPromo ? (
                <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                  Promo
                </span>
              ) : null}
              {product.isRecommended ? (
                <span className="rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  Rekomendasi
                </span>
              ) : null}
            </div>

            {visibleVouchers.length > 0 ? (
              <div className="rounded-xl border border-purple-100 bg-purple-50 p-3">
                <p className="mb-1 text-xs font-semibold text-purple-700">Voucher tersedia</p>
                <div className="flex flex-wrap gap-1.5">
                  {visibleVouchers.map((voucher) => (
                    <span
                      key={voucher.id}
                      className="rounded bg-purple-100 px-2 py-0.5 font-mono text-xs text-purple-800"
                    >
                      {voucher.code}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <WhatsAppInquiryButton
              productId={publicProductKey}
              productSlug={product.slug ?? undefined}
              sourcePage="product-detail"
              size="large"
              className="w-full"
            />

            {product.shortSpecification ? (
              <p className="border-t border-[var(--color-border)] pt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {product.shortSpecification}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-10">
          <TabGroup tabs={["Deskripsi Produk", "Spesifikasi Teknis"]}>
            <div>
              {product.description ? (
                <div className="max-w-none whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {product.description}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">Deskripsi tidak tersedia.</p>
              )}
            </div>
            <div>
              {specs.length > 0 ? (
                <table className="w-full text-sm">
                  <tbody>
                    {specs.map(([key, value], i) => (
                      <tr key={`${key}-${i}`} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="w-40 py-2.5 pr-6 align-top font-medium text-[var(--color-text)]">
                          {String(key)}
                        </td>
                        <td className="py-2.5 align-top text-[var(--color-text-muted)]">
                          {String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">Spesifikasi tidak tersedia.</p>
              )}
            </div>
          </TabGroup>
        </div>

        {relatedCards.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Produk Serupa</h2>
            <ProductGrid products={relatedCards} columns={4} />
          </section>
        ) : null}
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

function StockChip({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    READY: { label: "Tersedia", className: "bg-green-50 text-green-700 border border-green-100" },
    LOW_STOCK: { label: "Stok Terbatas", className: "bg-amber-50 text-amber-700 border border-amber-100" },
    OUT_OF_STOCK: { label: "Habis", className: "bg-red-50 text-red-700 border border-red-100" },
    PREORDER: { label: "Pre-order", className: "bg-blue-50 text-blue-700 border border-blue-100" },
  };
  const chip = map[status] ?? map.READY;

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${chip.className}`}>
      {chip.label}
    </span>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function safeReturnUrl(value: string, fallback: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("http://") || value.includes("https://")) return fallback;
  if (!value.startsWith("/products")) return fallback;
  return value;
}

function uniqueImages(images: Array<string | null | undefined>) {
  return Array.from(new Set(images.filter(Boolean))) as string[];
}

function specRows(value: unknown): Array<[string, string]> {
  if (!value) return [];
  if (typeof value === "string") return [["Detail", value]];
  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).map(([key, item]) => [
      key,
      typeof item === "string" ? item : JSON.stringify(item),
    ]);
  }
  return [["Detail", JSON.stringify(value)]];
}
