import { ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal, X, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import FigmaFooter from "@/components/layout/FigmaFooter";
import FlashSaleCountdown from "@/components/ui/FlashSaleCountdown";
import FigmaPromoBannerRow from "@/components/ui/FigmaPromoBannerRow";
import ProductGrid from "@/components/ui/ProductGrid";
import TrackedProductLink from "@/components/ui/TrackedProductLink";
import FigmaSiteHeader from "@/components/layout/FigmaSiteHeader";

import type { Prisma, StockStatus } from "@/generated/prisma/client";
import { canSeeRetailPrice, productCardSelect, canUseRetailVoucher, getVisibleVouchers } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { buildActiveFlashSaleMap, getFlashSaleDisplayForViewer } from "@/lib/flash-sale";
import { toProductCardProps } from "@/lib/product-card-mapper";
import { toPublicPromoBanners } from "@/lib/promo-banner-display";
import { getCurrentUser } from "@/lib/session";
import { buildWhatsappUrl, resolveStoreWhatsappNumber } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const stockStatuses: Array<{ label: string; value: StockStatus }> = [
  { label: "Ready", value: "READY" },
  { label: "Low stock", value: "LOW_STOCK" },
  { label: "Out of stock", value: "OUT_OF_STOCK" },
  { label: "Preorder", value: "PREORDER" },
];

const sortOptions = [
  { label: "Rekomendasi", value: "recommended" },
  { label: "Terbaru", value: "latest" },
  { label: "Harga termurah", value: "price_asc" },
  { label: "Harga tertinggi", value: "price_desc" },
  { label: "Paling Banyak Ditanya", value: "inquiryCount" },
];

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;
const MIN_SEARCH_LENGTH = 2;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const q = firstParam(params.q);
  const category = firstParam(params.category);
  const brand = firstParam(params.brand);
  const stock = parseStock(firstParam(params.stock));
  const sort = parseSort(firstParam(params.sort));
  const pageSize = parsePageSize(firstParam(params.pageSize));
  const page = parsePage(firstParam(params.page));
  const serverNow = new Date().getTime();
  const priceMin = firstParam(params.priceMin);
  const priceMax = firstParam(params.priceMax);
  const promoFilter = firstParam(params.promo) === "1";
  const flashSaleFilter = firstParam(params.flashSale) === "1";
  const db = getDb();

  const trimmedQ = q.trim();
  const searchQ = trimmedQ.length >= MIN_SEARCH_LENGTH ? trimmedQ : "";

  const currentUrl = buildCurrentUrl({
    q, category, brand, stock, sort, page, pageSize,
    priceMin, priceMax, promo: promoFilter ? "1" : "", flashSale: flashSaleFilter ? "1" : "",
  });

  const [user, retailPriceEnabled, publicVoucherEnabled, retailVoucherEnabled] =
    await Promise.all([
      getCurrentUser().catch(() => null),
      isFeatureEnabled("enable_retail_price"),
      isFeatureEnabled("enable_public_voucher"),
      isFeatureEnabled("enable_retail_voucher"),
    ]);

  const filters: Prisma.ProductWhereInput[] = [];
  if (searchQ) {
    filters.push({
      OR: [
        { name: { contains: searchQ } },
        { sku: { contains: searchQ } },
        { brand: { is: { name: { contains: searchQ } } } },
        { category: { is: { name: { contains: searchQ } } } },
      ],
    });
  }
  if (category) filters.push({ category: { slug: category } });
  if (brand) filters.push({ brand: { slug: brand } });
  if (stock) filters.push({ stockStatus: stock });
  if (priceMin) {
    const min = Number(priceMin);
    if (!Number.isNaN(min)) filters.push({ publicPrice: { gte: min } });
  }
  if (priceMax) {
    const max = Number(priceMax);
    if (!Number.isNaN(max)) filters.push({ publicPrice: { lte: max } });
  }
  if (promoFilter) {
    filters.push({
      vouchers: {
        some: {
          voucher: {
            isActive: true,
            status: "ACTIVE",
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
        },
      },
    });
  }
  if (flashSaleFilter) {
    filters.push({
      flashSaleProducts: {
        some: {
          flashSale: {
            isActive: true,
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
        },
      },
    });
  }

  const productWhere: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    AND: filters,
  };

  const isRetailActive = user?.retailStatus === "RETAIL_ACTIVE";

  const [categories, brands, totalProducts, products, vouchers,
    activeFlashSaleProducts, promoBanners, promoEnabled, whatsappNumber] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.brand.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.product.count({ where: productWhere }),
    db.product.findMany({
      where: productWhere,
      select: productCardSelect,
      orderBy: productOrderBy(sort),
      take: pageSize,
      skip: (page - 1) * pageSize,
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
        flashSale: { select: { showForPublic: true, showForRetail: true, endsAt: true } },
        product: { select: productCardSelect },
      },
      orderBy: { sortOrder: "asc" },
      take: 100,
    }),
    db.promoBanner.findMany({
      where: {
        isActive: true,
        [isRetailActive ? "showForRetail" : "showForPublic"]: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 10,
    }),
    isFeatureEnabled("enable_promo_banner"),
    resolveStoreWhatsappNumber(db),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

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

  const cardsWithReturnUrl = productCards.map((card) => ({
    ...card,
    href: `${card.href}?returnUrl=${encodeURIComponent(currentUrl)}`,
  }));

  const activeFlashSale = activeFlashSaleProducts[0]?.flashSale ?? null;
  const flashSaleProducts = activeFlashSaleProducts.flatMap((fp) => {
    const flashSaleDisplay = getFlashSaleDisplayForViewer(fp, showRetailPrice);
    if (!flashSaleDisplay) return [];

    return [
      toProductCardProps(fp.product, {
        user,
        retailPriceEnabled,
        publicVoucherEnabled,
        retailVoucherEnabled,
        vouchers,
        hasActiveFlashSale: true,
        flashSalePrice: flashSaleDisplay.price,
        flashSaleStock: flashSaleDisplay.stock,
      }),
    ];
  });

  const canSeeRetailVouchers = canUseRetailVoucher(user);
  const promoBannerVoucherIds = Array.from(
    new Set(promoBanners.map((banner) => banner.voucherId).filter(Boolean)),
  ) as string[];
  const promoBannerVouchers = promoBannerVoucherIds.length
    ? await db.voucher.findMany({ where: { id: { in: promoBannerVoucherIds } } })
    : [];
  const publicPromoBanners = toPublicPromoBanners(
    promoBanners,
    new Map(promoBannerVouchers.map((voucher) => [voucher.id, voucher])),
    {
      publicVoucherEnabled,
      retailVoucherEnabled,
      canSeeRetailVoucher: canSeeRetailVouchers,
    },
  );
  const visibleVouchers = getVisibleVouchers(vouchers, {
    publicVoucherEnabled,
    retailVoucherEnabled,
    canSeeRetail: canSeeRetailVouchers,
  });
  const generalWaUrl = buildWhatsappUrl({
    whatsappNumber,
    message: "Halo Admin, saya ingin bertanya tentang produk komputer dan aksesoris di katalog.",
  });

  const activeFilters = buildActiveFilters({
    q, category, brand, stock, sort, pageSize, priceMin, priceMax,
    promo: promoFilter ? "1" : "", flashSale: flashSaleFilter ? "1" : "",
    categories, brands,
  });

  return (
    <main className="min-h-screen bg-brand-bg pb-8 text-brand-text">
      <FigmaSiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* ── Hero / Catalog Banner ── */}
        <section className="rounded-3xl bg-gradient-to-br from-brand-primary-dark via-brand-primary to-brand-secondary p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-brand-accent">
                Katalog marketplace
              </p>
              <h1 className="mt-2 text-3xl font-black leading-tight">
                Produk Komputer & Aksesoris Elektronik
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                Pilih produk, cek harga umum atau harga ritel aktif, lalu lanjut konsultasi lewat
                WhatsApp.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black ring-1 ring-white/20">
              <Filter className="size-5 text-brand-accent" />
              {totalProducts} produk ditemukan
            </div>
          </div>
        </section>

        {/* ── Flash Sale Strip ── */}
        {flashSaleProducts.length > 0 && activeFlashSale ? (
          <section className="mt-5 overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Zap size={18} fill="var(--brand-accent)" stroke="none" />
                  <span className="text-base font-black text-brand-primary">FLASH SALE</span>
                </div>
                <FlashSaleCountdown
                  endsAt={activeFlashSale.endsAt.toISOString()}
                  initialNow={serverNow}
                />
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-brand-primary transition-opacity hover:opacity-70"
              >
                Lihat Semua &rarr;
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">
              {flashSaleProducts.map((product) => (
                <TrackedProductLink
                  key={product.href}
                  href={product.href}
                  productId={product.productId}
                  source="flash-sale-strip"
                  className="group w-44 shrink-0 overflow-hidden rounded-xl border border-brand-border bg-brand-bg transition hover:border-brand-primary hover:bg-white hover:shadow-sm"
                >
                  <div className="relative h-36 w-full overflow-hidden bg-gray-50">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="176px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-primary/10 to-brand-secondary/25">
                        <Zap className="size-8 text-brand-primary/60" />
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded bg-brand-accent px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                      {product.badge ?? "PROMO"}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="mb-1.5 line-clamp-2 text-xs font-semibold leading-tight text-brand-text">
                      {product.name}
                    </p>
                    {product.flashSalePrice ? (
                      <>
                        <p className="text-sm font-black text-brand-accent">
                          {product.flashSalePrice}
                        </p>
                        <p className="mt-0.5 text-[10px] text-brand-muted line-through">
                          {product.showRetailAsPrimary && product.retailPrice
                            ? product.retailPrice
                            : product.publicPrice}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-black text-brand-accent">
                        {product.showRetailAsPrimary && product.retailPrice
                          ? product.retailPrice
                          : product.publicPrice}
                      </p>
                    )}
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: "60%",
                          background:
                            "linear-gradient(to right, var(--brand-accent), var(--brand-primary))",
                        }}
                      />
                    </div>
                    <p className="mt-0.5 text-[10px] text-brand-muted">
                      {product.stockText ?? "Cek stok"}
                    </p>
                  </div>
                </TrackedProductLink>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── Promo & Voucher Strip ── */}
        <div className="mt-5">
          <FigmaPromoBannerRow
            whatsappUrl={generalWaUrl}
            hasVoucher={visibleVouchers.length > 0}
            banners={publicPromoBanners}
            enabled={promoEnabled}
          />
        </div>

        {/* ── Search & Sort bar ── */}
        <section className="mt-5 rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
          <form action="/products" className="grid gap-3 lg:grid-cols-[1fr_210px_auto]">
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="brand" value={brand} />
            <input type="hidden" name="stock" value={stock} />
            <input type="hidden" name="priceMin" value={priceMin ?? ""} />
            <input type="hidden" name="priceMax" value={priceMax ?? ""} />
            <input type="hidden" name="promo" value={promoFilter ? "1" : ""} />
            <input type="hidden" name="flashSale" value={flashSaleFilter ? "1" : ""} />
            <label className="flex items-center gap-2 rounded-2xl border border-brand-border bg-brand-bg px-3 py-2 focus-within:border-brand-primary focus-within:bg-white">
              <Search className="size-5 shrink-0 text-brand-primary" />
              <input
                name="q"
                defaultValue={q}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                placeholder="Cari nama produk, brand, kategori, SKU..."
              />
            </label>
            <select
              name="sort"
              defaultValue={sort}
              className="rounded-2xl border border-brand-border bg-white px-3 py-3 text-sm font-bold outline-none focus:border-brand-primary"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-2xl bg-brand-primary px-5 py-3 text-sm font-black text-white transition hover:bg-brand-hover"
            >
              Terapkan
            </button>
          </form>

          {activeFilters.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-brand-muted">
                Filter aktif
              </span>
              {activeFilters.map((filter) => (
                <Link
                  key={filter.key}
                  href={filter.href}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-bg px-3 py-1.5 text-xs font-black text-brand-primary transition hover:bg-brand-primary hover:text-white"
                >
                  {filter.label}
                  <X className="size-3" />
                </Link>
              ))}
              <Link
                href="/products"
                className="rounded-full border border-brand-border px-3 py-1.5 text-xs font-black text-brand-muted transition hover:border-brand-primary hover:text-brand-primary"
              >
                Reset semua
              </Link>
            </div>
          ) : null}
        </section>

        {/* ── Main Content: Sidebar Filters + Product Grid ── */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <FilterPanel
              q={q}
              category={category}
              brand={brand}
              stock={stock}
              sort={sort}
              priceMin={priceMin ?? ""}
              priceMax={priceMax ?? ""}
              promo={promoFilter ? "1" : ""}
              flashSale={flashSaleFilter ? "1" : ""}
              categories={categories}
              brands={brands}
            />
          </aside>

          <section className="min-w-0">
            <details className="mb-4 rounded-2xl border border-brand-border bg-white p-4 shadow-sm lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black text-brand-primary">
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="size-5" />
                  Filter produk
                </span>
                <span>{activeFilters.length} aktif</span>
              </summary>
              <div className="mt-4">
                <FilterPanel
                  q={q}
                  category={category}
                  brand={brand}
                  stock={stock}
                  sort={sort}
                  priceMin={priceMin ?? ""}
                  priceMax={priceMax ?? ""}
                  promo={promoFilter ? "1" : ""}
                  flashSale={flashSaleFilter ? "1" : ""}
                  categories={categories}
                  brands={brands}
                  compact
                />
              </div>
            </details>

            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-brand-muted">
                Menampilkan{" "}
                <span className="text-brand-primary">{cardsWithReturnUrl.length}</span> dari{" "}
                <span className="text-brand-primary">{totalProducts}</span> produk
                {totalPages > 1 ? ` · Halaman ${page} / ${totalPages}` : ""}
              </p>
              <Link
                href="/vouchers"
                className="rounded-xl border border-brand-accent/20 bg-white px-3 py-2 text-xs font-black text-brand-accent transition hover:border-brand-accent"
              >
                Cek voucher
              </Link>
            </div>

            {cardsWithReturnUrl.length > 0 ? (
              <>
                <ProductGrid products={cardsWithReturnUrl} columns={4} />
                {totalPages > 1 ? (
                  <nav
                    aria-label="Navigasi halaman produk"
                    className="mt-6 flex items-center justify-center gap-2"
                  >
                    {page > 1 ? (
                      <Link
                        href={buildCurrentUrl({ q, category, brand, stock, sort, page: page - 1, pageSize, priceMin, priceMax, promo: promoFilter ? "1" : "", flashSale: flashSaleFilter ? "1" : "" })}
                        rel="prev"
                        className="inline-flex items-center gap-1 rounded-xl border border-brand-border bg-white px-4 py-2 text-sm font-black text-brand-primary transition hover:border-brand-primary"
                      >
                        <ChevronLeft className="size-4" />
                        Sebelumnya
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-xl border border-brand-border bg-brand-bg px-4 py-2 text-sm font-black text-brand-muted opacity-60">
                        <ChevronLeft className="size-4" />
                        Sebelumnya
                      </span>
                    )}
                    <span className="px-2 text-sm font-bold text-brand-muted">
                      {page} / {totalPages}
                    </span>
                    {page < totalPages ? (
                      <Link
                        href={buildCurrentUrl({ q, category, brand, stock, sort, page: page + 1, pageSize, priceMin, priceMax, promo: promoFilter ? "1" : "", flashSale: flashSaleFilter ? "1" : "" })}
                        rel="next"
                        className="inline-flex items-center gap-1 rounded-xl border border-brand-border bg-white px-4 py-2 text-sm font-black text-brand-primary transition hover:border-brand-primary"
                      >
                        Berikutnya
                        <ChevronRight className="size-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-xl border border-brand-border bg-brand-bg px-4 py-2 text-sm font-black text-brand-muted opacity-60">
                        Berikutnya
                        <ChevronRight className="size-4" />
                      </span>
                    )}
                  </nav>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-brand-border bg-white p-10 text-center shadow-sm">
                <h2 className="text-lg font-black text-brand-text">Produk tidak ditemukan</h2>
                <p className="mt-2 text-sm text-brand-muted">
                  Coba ubah kata kunci, kategori, brand, harga, atau status stok.
                </p>
                <Link
                  href="/products"
                  className="mt-5 inline-flex rounded-xl bg-brand-primary px-4 py-2 text-sm font-black text-white"
                >
                  Reset filter
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
      <FigmaFooter />
    </main>
  );
}

/* ─── Filter Panel ─── */

function FilterPanel({
  q,
  category,
  brand,
  stock,
  sort,
  priceMin,
  priceMax,
  promo,
  flashSale,
  categories,
  brands,
  compact = false,
}: {
  q: string;
  category: string;
  brand: string;
  stock: string;
  sort: string;
  priceMin: string;
  priceMax: string;
  promo: string;
  flashSale: string;
  categories: Array<{ id: string; name: string; slug: string }>;
  brands: Array<{ id: string; name: string; slug: string }>;
  compact?: boolean;
}) {
  return (
    <form
      action="/products"
      className={`rounded-2xl border border-brand-border bg-white p-4 shadow-sm ${compact ? "border-0 p-0 shadow-none" : ""}`}
    >
      <input type="hidden" name="q" value={q} />
      <input type="hidden" name="sort" value={sort} />
      <div className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-sm font-black text-brand-text">
          <SlidersHorizontal className="size-5 text-brand-primary" />
          Filter Katalog
        </h2>
        <Link href="/products" className="text-xs font-black text-brand-accent">
          Reset
        </Link>
      </div>

      <div className="mt-4 grid gap-4">
        {/* Kategori */}
        <SelectFilter label="Kategori" name="category" value={category}>
          <option value="">Semua kategori</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </SelectFilter>

        {/* Merek */}
        <SelectFilter label="Merek" name="brand" value={brand}>
          <option value="">Semua merek</option>
          {brands.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </SelectFilter>

        {/* Stok */}
        <SelectFilter label="Stok" name="stock" value={stock}>
          <option value="">Semua status</option>
          {stockStatuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </SelectFilter>

        {/* Rentang Harga */}
        <fieldset className="block text-sm font-black text-brand-text">
          <legend className="mb-2">Rentang Harga</legend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="priceMin"
              defaultValue={priceMin}
              placeholder="Min"
              min="0"
              className="w-full rounded-2xl border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-brand-text outline-none focus:border-brand-primary"
            />
            <span className="text-xs text-brand-muted">—</span>
            <input
              type="number"
              name="priceMax"
              defaultValue={priceMax}
              placeholder="Max"
              min="0"
              className="w-full rounded-2xl border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-brand-text outline-none focus:border-brand-primary"
            />
          </div>
        </fieldset>

        {/* Promo */}
        <label className="flex items-center gap-2 text-sm font-semibold text-brand-text">
          <input
            type="checkbox"
            name="promo"
            value="1"
            defaultChecked={promo === "1"}
            className="size-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary/30"
          />
          Promo
        </label>

        {/* Flash Sale */}
        <label className="flex items-center gap-2 text-sm font-semibold text-brand-text">
          <input
            type="checkbox"
            name="flashSale"
            value="1"
            defaultChecked={flashSale === "1"}
            className="size-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary/30"
          />
          Flash Sale
        </label>

        <button
          type="submit"
          className="rounded-2xl bg-brand-primary px-4 py-3 text-sm font-black text-white transition hover:bg-brand-hover"
        >
          Terapkan Filter
        </button>
      </div>
    </form>
  );
}

function SelectFilter({
  label,
  name,
  value,
  children,
}: {
  label: string;
  name: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-black text-brand-text">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="mt-2 w-full rounded-2xl border border-brand-border bg-white px-3 py-3 text-sm font-semibold text-brand-text outline-none focus:border-brand-primary"
      >
        {children}
      </select>
    </label>
  );
}

/* ─── URL Helpers ─── */

type UrlParams = {
  q: string;
  category: string;
  brand: string;
  stock: string;
  sort: string;
  page?: number;
  pageSize?: number;
  priceMin?: string;
  priceMax?: string;
  promo?: string;
  flashSale?: string;
};

function buildCurrentUrl(params: UrlParams) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.brand) search.set("brand", params.brand);
  if (params.stock) search.set("stock", params.stock);
  if (params.sort && params.sort !== "recommended") search.set("sort", params.sort);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.pageSize && params.pageSize !== DEFAULT_PAGE_SIZE) {
    search.set("pageSize", String(params.pageSize));
  }
  if (params.priceMin) search.set("priceMin", params.priceMin);
  if (params.priceMax) search.set("priceMax", params.priceMax);
  if (params.promo === "1") search.set("promo", "1");
  if (params.flashSale === "1") search.set("flashSale", "1");
  const qs = search.toString();
  return `/products${qs ? `?${qs}` : ""}`;
}

type RemoveParams = {
  q: string;
  category: string;
  brand: string;
  stock: string;
  sort: string;
  pageSize: number;
  priceMin: string;
  priceMax: string;
  promo: string;
  flashSale: string;
};

function removeParam(params: RemoveParams, keyToRemove: string) {
  return buildCurrentUrl({
    ...params,
    page: 1,
    [keyToRemove]: keyToRemove === "sort" ? "recommended" : "",
  });
}

function buildActiveFilters({
  q, category, brand, stock, sort, pageSize, priceMin, priceMax,
  promo, flashSale, categories, brands,
}: RemoveParams & {
  categories: Array<{ name: string; slug: string }>;
  brands: Array<{ name: string; slug: string }>;
}) {
  const params: RemoveParams = { q, category, brand, stock, sort, pageSize, priceMin, priceMax, promo, flashSale };
  const active: Array<{ key: string; label: string; href: string }> = [];

  if (q) active.push({ key: "q", label: `Cari: ${q}`, href: removeParam(params, "q") });
  if (category) {
    const label = categories.find((item) => item.slug === category)?.name ?? category;
    active.push({ key: "category", label: `Kategori: ${label}`, href: removeParam(params, "category") });
  }
  if (brand) {
    const label = brands.find((item) => item.slug === brand)?.name ?? brand;
    active.push({ key: "brand", label: `Merek: ${label}`, href: removeParam(params, "brand") });
  }
  if (stock) active.push({ key: "stock", label: `Stok: ${stock}`, href: removeParam(params, "stock") });
  if (sort !== "recommended") {
    const label = sortOptions.find((item) => item.value === sort)?.label ?? sort;
    active.push({ key: "sort", label: `Urut: ${label}`, href: removeParam(params, "sort") });
  }
  if (priceMin) active.push({ key: "priceMin", label: `Harga min: Rp ${Number(priceMin).toLocaleString("id-ID")}`, href: removeParam(params, "priceMin") });
  if (priceMax) active.push({ key: "priceMax", label: `Harga max: Rp ${Number(priceMax).toLocaleString("id-ID")}`, href: removeParam(params, "priceMax") });
  if (promo === "1") active.push({ key: "promo", label: "Promo", href: removeParam(params, "promo") });
  if (flashSale === "1") active.push({ key: "flashSale", label: "Flash Sale", href: removeParam(params, "flashSale") });

  return active;
}

/* ─── Sort / Parse helpers ─── */

function productOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "price_asc") return [{ publicPrice: "asc" }, { createdAt: "desc" }];
  if (sort === "price_desc") return [{ publicPrice: "desc" }, { createdAt: "desc" }];
  if (sort === "latest") return [{ createdAt: "desc" }];
  if (sort === "inquiryCount") {
    return [
      { inquiryCount: "desc" },
      { clickCount: "desc" },
      { viewCount: "desc" },
      { createdAt: "desc" },
    ];
  }
  return [
    { inquiryCount: "desc" },
    { clickCount: "desc" },
    { viewCount: "desc" },
    { createdAt: "desc" },
  ];
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseStock(value: string): StockStatus | "" {
  if (
    value === "READY" ||
    value === "LOW_STOCK" ||
    value === "OUT_OF_STOCK" ||
    value === "PREORDER"
  ) {
    return value;
  }
  return "";
}

function parseSort(value: string) {
  if (value === "latest" || value === "price_asc" || value === "price_desc" || value === "inquiryCount") return value;
  return "recommended";
}

function parsePage(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

function parsePageSize(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
}
