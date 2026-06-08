import { Suspense } from "react";

import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";

import PriceRangeInputs from "@/components/catalog/PriceRangeInputs";
import PublicNavbar from "@/components/layout/PublicNavbar";
import ProductGrid from "@/components/ui/ProductGrid";
import PublicFooter from "@/components/ui/PublicFooter";
import type { Prisma } from "@/generated/prisma/client";
import {
  canSeeRetailPrice,
  productCardSelect,
  voucherWithScopeSelect,
} from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { buildActiveFlashSaleMap, getFlashSaleDisplayForViewer } from "@/lib/flash-sale";
import { toProductCardProps } from "@/lib/product-card-mapper";
import { getCurrentUser } from "@/lib/session";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { buildWhatsappUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 20;
const MIN_SEARCH_LENGTH = 2;

const sortOptions = [
  { label: "Rekomendasi", value: "recommended" },
  { label: "Terbaru", value: "latest" },
  { label: "Harga termurah", value: "price_asc" },
  { label: "Harga tertinggi", value: "price_desc" },
  { label: "Paling Banyak Ditanya", value: "inquiryCount" },
];

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const q = firstParam(params.q) || firstParam(params.search);
  const category = firstParam(params.category);
  const brand = firstParam(params.brand);
  const sort = parseSort(firstParam(params.sort));
  const page = parsePage(firstParam(params.page));
  const priceMin = firstParam(params.priceMin);
  const priceMax = firstParam(params.priceMax);
  const promoFilter = firstParam(params.promo) === "1";
  const flashSaleFilter = firstParam(params.flashSale) === "1";
  const skip = (page - 1) * PAGE_SIZE;
  const now = new Date();
  const db = getDb();

  const [
    user,
    retailPriceEnabled,
    publicVoucherEnabled,
    retailVoucherEnabled,
    flashSaleEnabled,
    settings,
  ] = await Promise.all([
    getCurrentUser().catch(() => null),
    isFeatureEnabled("enable_retail_price"),
    isFeatureEnabled("enable_public_voucher"),
    isFeatureEnabled("enable_retail_voucher"),
    isFeatureEnabled("enable_flash_sale"),
    getPublicSiteSettings(),
  ]);

  const filters = buildProductFilters({
    q,
    category,
    brand,
    priceMin,
    priceMax,
    promoFilter,
    flashSaleFilter: flashSaleFilter && flashSaleEnabled,
    now,
  });
  const productWhere: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    category: { isActive: true },
    brand: { isActive: true },
    AND: filters,
  };
  const currentUrl = buildCurrentUrl({
    q,
    category,
    brand,
    sort,
    page,
    priceMin,
    priceMax,
    promo: promoFilter ? "1" : "",
    flashSale: flashSaleFilter ? "1" : "",
  });

  // Lightweight shell data only — fetched before the first byte so the navbar,
  // hero, <h1> (the LCP candidate), and filter panels can stream immediately.
  // The expensive product/voucher/flash-sale fetch is deferred to <ProductResults>
  // behind a Suspense boundary below, so it no longer blocks the initial paint.
  const [categories, brands, totalCount] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, logoUrl: true },
    }),
    db.brand.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
    db.product.count({ where: productWhere }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const activeFilters = buildActiveFilters({
    q,
    category,
    brand,
    sort,
    priceMin,
    priceMax,
    promo: promoFilter ? "1" : "",
    flashSale: flashSaleFilter ? "1" : "",
    categories,
    brands,
  });
  const generalWaUrl = buildWhatsappUrl({
    message: "Halo Admin, saya ingin bertanya tentang produk yang tersedia di katalog.",
    whatsappNumber: settings.whatsappNumber,
  });

  return (
    <main className="min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
      <PublicNavbar
        whatsappUrl={generalWaUrl}
        session={user}
        announcementText={settings.announcementEnabled ? settings.announcementText : ""}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                Katalog produk
              </p>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-[var(--color-text)]">
                Produk Komputer & Aksesoris Elektronik
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
                Pilih produk, cek harga umum atau harga ritel aktif, lalu lanjut konsultasi lewat
                WhatsApp.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 text-sm font-semibold text-[var(--color-text-muted)]">
              <Filter className="size-5 text-[var(--color-accent)]" />
              {totalCount} produk ditemukan
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
          <form action="/products" className="grid gap-3 lg:grid-cols-[1fr_210px_auto]">
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="brand" value={brand} />
            <input type="hidden" name="priceMin" value={priceMin} />
            <input type="hidden" name="priceMax" value={priceMax} />
            <input type="hidden" name="promo" value={promoFilter ? "1" : ""} />
            <input type="hidden" name="flashSale" value={flashSaleFilter ? "1" : ""} />
            <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 focus-within:border-[var(--color-accent)]">
              <Search className="size-5 shrink-0 text-[var(--color-accent)]" />
              <input
                name="q"
                defaultValue={q}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
                placeholder="Cari nama produk, brand, kategori, SKU..."
              />
            </label>
            <select
              name="sort"
              defaultValue={sort}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-3 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--color-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] active:translate-y-px disabled:cursor-not-allowed disabled:bg-[var(--color-border-strong)] disabled:text-white"
            >
              Terapkan
            </button>
          </form>

          {activeFilters.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Filter aktif
              </span>
              {activeFilters.map((filter) => (
                <Link
                  key={filter.key}
                  href={filter.href}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] transition hover:bg-[var(--color-page)]"
                >
                  {filter.label}
                  <X className="size-3" />
                </Link>
              ))}
              <Link
                href="/products"
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Reset semua
              </Link>
            </div>
          ) : null}
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <FilterPanel
              q={q}
              category={category}
              brand={brand}
              sort={sort}
              priceMin={priceMin}
              priceMax={priceMax}
              promo={promoFilter ? "1" : ""}
              flashSale={flashSaleFilter ? "1" : ""}
              categories={categories}
              brands={brands}
            />
          </aside>

          <section className="min-w-0">
            <details className="mb-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[var(--color-text)]">
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
                  sort={sort}
                  priceMin={priceMin}
                  priceMax={priceMax}
                  promo={promoFilter ? "1" : ""}
                  flashSale={flashSaleFilter ? "1" : ""}
                  categories={categories}
                  brands={brands}
                  compact
                />
              </div>
            </details>

            <Suspense fallback={<ProductResultsFallback />}>
              <ProductResults
                productWhere={productWhere}
                sort={sort}
                skip={skip}
                page={page}
                totalCount={totalCount}
                totalPages={totalPages}
                currentUrl={currentUrl}
                now={now}
                flashSaleEnabled={flashSaleEnabled}
                user={user}
                retailPriceEnabled={retailPriceEnabled}
                publicVoucherEnabled={publicVoucherEnabled}
                retailVoucherEnabled={retailVoucherEnabled}
                listParams={{
                  q,
                  category,
                  brand,
                  sort,
                  priceMin,
                  priceMax,
                  promo: promoFilter ? "1" : "",
                  flashSale: flashSaleFilter ? "1" : "",
                }}
              />
            </Suspense>
          </section>
        </div>
      </div>

      <PublicFooter
        whatsappUrl={generalWaUrl}
        storeName={settings.storeName}
        storeAddress={settings.address}
        publicVoucherEnabled={publicVoucherEnabled}
        topCategories={categories}
      />
    </main>
  );
}

async function ProductResults({
  productWhere,
  sort,
  skip,
  page,
  totalCount,
  totalPages,
  currentUrl,
  now,
  flashSaleEnabled,
  user,
  retailPriceEnabled,
  publicVoucherEnabled,
  retailVoucherEnabled,
  listParams,
}: {
  productWhere: Prisma.ProductWhereInput;
  sort: string;
  skip: number;
  page: number;
  totalCount: number;
  totalPages: number;
  currentUrl: string;
  now: Date;
  flashSaleEnabled: boolean;
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  retailPriceEnabled: boolean;
  publicVoucherEnabled: boolean;
  retailVoucherEnabled: boolean;
  listParams: UrlParams;
}) {
  const db = getDb();
  const [products, vouchers, activeFlashSaleProducts] = await Promise.all([
    db.product.findMany({
      where: productWhere,
      select: productCardSelect,
      orderBy: productOrderBy(sort),
      take: PAGE_SIZE,
      skip,
    }),
    db.voucher.findMany({
      where: { isActive: true, status: "ACTIVE" },
      select: voucherWithScopeSelect,
      orderBy: { createdAt: "desc" },
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
          include: {
            flashSale: { select: { showForPublic: true, showForRetail: true, endsAt: true } },
            product: { select: productCardSelect },
          },
          orderBy: { sortOrder: "asc" },
          take: 100,
        })
      : Promise.resolve([]),
  ]);

  const showRetailPrice = canSeeRetailPrice(user, retailPriceEnabled);
  const flashSaleMap = buildActiveFlashSaleMap(activeFlashSaleProducts);
  const cardsWithReturnUrl = products.map((product) => {
    const activeFlashSale = flashSaleMap.get(product.id);
    const flashSaleDisplay = getFlashSaleDisplayForViewer(activeFlashSale, showRetailPrice);
    const card = toProductCardProps(product, {
      user,
      retailPriceEnabled,
      publicVoucherEnabled,
      retailVoucherEnabled,
      vouchers,
      hasActiveFlashSale: Boolean(activeFlashSale),
      flashSalePrice: flashSaleDisplay?.price,
      flashSaleStock: flashSaleDisplay?.stock,
    });
    return { ...card, href: `${card.href}?returnUrl=${encodeURIComponent(currentUrl)}` };
  });

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--color-text-muted)]">
          Menampilkan{" "}
          <span className="text-[var(--color-accent)]">{cardsWithReturnUrl.length}</span>{" "}
          dari <span className="text-[var(--color-accent)]">{totalCount}</span> produk
          {totalPages > 1 ? ` - Halaman ${page} / ${totalPages}` : ""}
        </p>
        <Link
          href="/vouchers"
          className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-accent)] transition hover:border-[var(--color-accent)]"
        >
          Cek voucher
        </Link>
      </div>

      {cardsWithReturnUrl.length > 0 ? (
        <>
          <ProductGrid products={cardsWithReturnUrl} columns={4} />
          {totalPages > 1 ? (
            <Pagination
              params={listParams}
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
            />
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Produk tidak ditemukan</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Coba ubah kata kunci, kategori, brand, harga, atau status promo.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            Reset filter
          </Link>
        </div>
      )}
    </>
  );
}

function ProductResultsFallback() {
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="h-5 w-44 animate-pulse rounded bg-[var(--color-border)]" />
        <div className="h-8 w-24 animate-pulse rounded-xl bg-[var(--color-border)]" />
      </div>
      <div className="grid min-w-0 grid-cols-2 items-stretch gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:gap-4 xl:grid-cols-5">
        {Array.from({ length: PAGE_SIZE }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-2xl border border-[var(--color-border)] bg-white/60"
          />
        ))}
      </div>
    </>
  );
}

function FilterPanel({
  q,
  category,
  brand,
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
      className={`rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm ${
        compact ? "border-0 p-0 shadow-none" : ""
      }`}
    >
      <input type="hidden" name="q" value={q} />
      <input type="hidden" name="sort" value={sort} />
      <div className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
          <SlidersHorizontal className="size-5 text-[var(--color-accent)]" />
          Filter Katalog
        </h2>
        <Link href="/products" className="text-xs font-semibold text-[var(--color-accent)]">
          Reset
        </Link>
      </div>

      <div className="mt-4 grid gap-4">
        <SelectFilter label="Kategori" name="category" value={category}>
          <option value="">Semua kategori</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter label="Merek" name="brand" value={brand}>
          <option value="">Semua merek</option>
          {brands.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </SelectFilter>

        <PriceRangeInputs minValue={priceMin} maxValue={priceMax} />

        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
          <input
            type="checkbox"
            name="promo"
            value="1"
            defaultChecked={promo === "1"}
            className="size-4 rounded border-[var(--color-border)] text-[var(--color-accent)]"
          />
          Promo
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
          <input
            type="checkbox"
            name="flashSale"
            value="1"
            defaultChecked={flashSale === "1"}
            className="size-4 rounded border-[var(--color-border)] text-[var(--color-accent)]"
          />
          Flash Sale
        </label>

        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--color-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] active:translate-y-px disabled:cursor-not-allowed disabled:bg-[var(--color-border-strong)] disabled:text-white"
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
    <label className="block text-sm font-semibold text-[var(--color-text)]">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-3 text-sm font-medium text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
      >
        {children}
      </select>
    </label>
  );
}

type UrlParams = {
  q: string;
  category: string;
  brand: string;
  sort: string;
  page?: number;
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
  if (params.sort && params.sort !== "recommended") search.set("sort", params.sort);
  if (params.page && params.page > 1) search.set("page", String(params.page));
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
  sort: string;
  priceMin: string;
  priceMax: string;
  promo: string;
  flashSale: string;
};

function removeParam(params: RemoveParams, keyToRemove: keyof RemoveParams) {
  return buildCurrentUrl({
    ...params,
    page: 1,
    [keyToRemove]: keyToRemove === "sort" ? "recommended" : "",
  });
}

function buildActiveFilters({
  q,
  category,
  brand,
  sort,
  priceMin,
  priceMax,
  promo,
  flashSale,
  categories,
  brands,
}: RemoveParams & {
  categories: Array<{ name: string; slug: string }>;
  brands: Array<{ name: string; slug: string }>;
}) {
  const params: RemoveParams = { q, category, brand, sort, priceMin, priceMax, promo, flashSale };
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
  if (sort !== "recommended") {
    const label = sortOptions.find((item) => item.value === sort)?.label ?? sort;
    active.push({ key: "sort", label: `Urut: ${label}`, href: removeParam(params, "sort") });
  }
  if (priceMin) {
    active.push({
      key: "priceMin",
      label: `Harga min: Rp ${Number(priceMin).toLocaleString("id-ID")}`,
      href: removeParam(params, "priceMin"),
    });
  }
  if (priceMax) {
    active.push({
      key: "priceMax",
      label: `Harga max: Rp ${Number(priceMax).toLocaleString("id-ID")}`,
      href: removeParam(params, "priceMax"),
    });
  }
  if (promo === "1") active.push({ key: "promo", label: "Promo", href: removeParam(params, "promo") });
  if (flashSale === "1") {
    active.push({ key: "flashSale", label: "Flash Sale", href: removeParam(params, "flashSale") });
  }

  return active;
}

function buildProductFilters({
  q,
  category,
  brand,
  priceMin,
  priceMax,
  promoFilter,
  flashSaleFilter,
  now,
}: {
  q: string;
  category: string;
  brand: string;
  priceMin: string;
  priceMax: string;
  promoFilter: boolean;
  flashSaleFilter: boolean;
  now: Date;
}) {
  const filters: Prisma.ProductWhereInput[] = [];
  const trimmedQ = q.trim();
  const searchQ = trimmedQ.length >= MIN_SEARCH_LENGTH ? trimmedQ : "";

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
            startsAt: { lte: now },
            endsAt: { gte: now },
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
            startsAt: { lte: now },
            endsAt: { gte: now },
          },
        },
      },
    });
  }

  return filters;
}

function Pagination({
  params,
  page,
  totalPages,
  totalCount,
}: {
  params: UrlParams;
  page: number;
  totalPages: number;
  totalCount: number;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <PaginationLink href={buildCurrentUrl({ ...params, page: page - 1 })} label="Sebelumnya" variant="outline" />
      ) : null}
      {getPaginationRange(page, totalPages).map((p, index) =>
        p === "..." ? (
          <span key={`${p}-${index}`} className="px-3 py-2 text-sm text-[var(--color-text-muted)]">
            ...
          </span>
        ) : (
          <PaginationLink
            key={p}
            href={buildCurrentUrl({ ...params, page: Number(p) })}
            label={String(p)}
            variant={p === page ? "active" : "outline"}
          />
        ),
      )}
      {page < totalPages ? (
        <PaginationLink href={buildCurrentUrl({ ...params, page: page + 1 })} label="Selanjutnya" variant="outline" />
      ) : null}
      <span className="ml-2 text-xs text-[var(--color-text-muted)]">
        Halaman {page} dari {totalPages} ({totalCount} produk)
      </span>
    </div>
  );
}

function getPaginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range: (number | "...")[] = [1];
  if (current > 3) range.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i += 1) {
    range.push(i);
  }
  if (current < total - 2) range.push("...");
  range.push(total);
  return range;
}

function PaginationLink({
  href,
  label,
  variant,
}: {
  href: string;
  label: string;
  variant: "active" | "outline";
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        variant === "active"
          ? "bg-[var(--color-accent)] text-white"
          : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white"
      }`}
    >
      {label}
    </Link>
  );
}

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

function parseSort(value: string) {
  if (value === "latest" || value === "price_asc" || value === "price_desc" || value === "inquiryCount") {
    return value;
  }
  return "recommended";
}

function parsePage(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}
