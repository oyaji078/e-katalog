import {
  Cpu,
  HardDrive,
  Keyboard,
  Laptop,
  Monitor,
  Mouse,
  Network,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import PublicNavbar from "@/components/layout/PublicNavbar";
import AnalyticsPageTracker from "@/components/ui/AnalyticsPageTracker";
import HeroBanner from "@/components/ui/HeroBanner";
import ProductGrid from "@/components/ui/ProductGrid";
import PublicFooter from "@/components/ui/PublicFooter";
import type { Prisma } from "@/generated/prisma/client";
import {
  canSeeRetailPrice,
  canUseRetailVoucher,
  formatRupiah,
  getVisibleVouchers,
  productCardSelect,
  voucherLabel,
  voucherWithScopeSelect,
} from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  activeFlashSaleProductSelect,
  buildActiveFlashSaleMap,
  getFlashSaleDisplayForViewer,
} from "@/lib/flash-sale";
import { toProductCardProps } from "@/lib/product-card-mapper";
import { getCurrentUser } from "@/lib/session";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { getStoreWhatsappNumberFromDB } from "@/lib/store-settings";
import { isRenderablePromoBannerImageUrl } from "@/lib/promo-banner-url";
import { buildWhatsappUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

const categoryIcons = [Laptop, Cpu, Monitor, Keyboard, Mouse, Printer, Network, HardDrive];

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const categorySlug = firstParam(params.category);
  const sort = parseSort(firstParam(params.sort));
  const page = parsePage(firstParam(params.page));
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

  const isRetailActive = user?.retailStatus === "RETAIL_ACTIVE";
  const productWhere = buildProductWhere(categorySlug, sort, now, {
    voucherEnabled: isRetailActive ? retailVoucherEnabled : publicVoucherEnabled,
    flashSaleEnabled,
  });

  const [
    categories,
    products,
    vouchers,
    activeFlashSaleProducts,
    activeHeroBanners,
    settings,
    waNumber,
  ] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, logoUrl: true },
    }),
    db.product.findMany({
      where: productWhere,
      select: productCardSelect,
      orderBy: productOrderBy(sort),
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    db.voucher.findMany({
      where: {
        isActive: true,
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      select: voucherWithScopeSelect,
      orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
      take: 6,
    }),
    flashSaleEnabled
      ? db.flashSaleProduct.findMany({
          where: {
            flashSale: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
          },
          select: activeFlashSaleProductSelect,
          orderBy: { sortOrder: "asc" },
          take: 100,
        })
      : Promise.resolve([]),
    db.heroBanner.findMany({
      where: {
        isActive: true,
        OR: [
          {
            AND: [
              { startsAt: { lte: now } },
              { endsAt: { gte: now } },
            ],
          },
          {
            AND: [
              { startsAt: null },
              { endsAt: null },
            ],
          },
          {
            AND: [
              { startsAt: null },
              { endsAt: { gte: now } },
            ],
          },
          {
            AND: [
              { startsAt: { lte: now } },
              { endsAt: null },
            ],
          },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, subtitle: true, imageUrl: true },
      take: 1,
    }),
    getPublicSiteSettings(),
    getStoreWhatsappNumberFromDB(),
  ]);

  const heroBanner = resolveHeroBanner(activeHeroBanners);

  const showRetailPrice = canSeeRetailPrice(user, retailPriceEnabled);
  const canSeeRetailVouchers = canUseRetailVoucher(user);
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
  const visibleVouchers = getVisibleVouchers(vouchers, {
    publicVoucherEnabled,
    retailVoucherEnabled,
    canSeeRetail: canSeeRetailVouchers,
  });
  const generalWaUrl = buildWhatsappUrl({
    message: "Halo Admin, saya ingin bertanya tentang produk yang tersedia di katalog.",
    whatsappNumber: waNumber,
  });

  return (
    <main className="min-h-screen bg-[var(--color-page)]">
      <AnalyticsPageTracker type="PAGE_VIEW" path="/" metadata={{ source: "home" }} />
      <PublicNavbar
        whatsappUrl={generalWaUrl}
        session={user}
        announcementText={settings.announcementEnabled ? settings.announcementText : ""}
      />

      {/* HERO — full viewport width, edge to edge, no container/radius */}
      {heroBanner ? (
        <HeroBanner
          title={heroBanner.title}
          subtitle={heroBanner.subtitle ?? undefined}
          image={heroBanner.image ?? undefined}
        />
      ) : (
        <div className="relative min-h-[380px] w-full overflow-hidden bg-[var(--color-brand-hero)] sm:min-h-[440px]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/55 to-transparent" />
          <div className="absolute bottom-0 left-0 z-10 px-8 pb-10 pt-8 sm:px-12 lg:px-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
              Rama Computer
            </p>
            <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl">
              Komputer & Aksesoris untuk Kebutuhan Kerja, Gaming, dan Toko Retail
            </h1>
            <p className="mt-3 max-w-xl text-base text-white/70">
              Cek katalog produk terlengkap. Tanya harga dan ketersediaan langsung via WhatsApp.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-12 pt-6 sm:px-6">
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-5 w-1 shrink-0 rounded-full bg-[var(--color-accent)]" />
              <h2 className="text-lg font-bold text-[var(--color-text)]">Kategori Produk</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            {categories.map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length];
              return (
                <Link
                  href={`/categories/${category.slug}`}
                  key={category.id}
                  className="group flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-white px-3 py-4 text-center transition-all duration-200 hover:border-[var(--color-accent)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.10)]"
                >
                  <span className="mb-2.5 flex size-11 items-center justify-center rounded-[10px] bg-[var(--color-accent-soft)] transition-colors group-hover:bg-[var(--color-accent)]">
                    <Icon className="size-[22px] text-[var(--color-accent)] transition-colors group-hover:text-white" />
                  </span>
                  <span className="text-[13px] font-medium leading-[1.3] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {visibleVouchers.length > 0 ? (
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 p-5 text-white">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-purple-200">
                Voucher Aktif
              </p>
              <p className="text-lg font-bold">{visibleVouchers[0].title}</p>
              <p className="mt-0.5 text-sm text-purple-200">
                Diskon {voucherLabel(visibleVouchers[0])}
                {visibleVouchers[0].minimumPurchase
                  ? `, min ${formatRupiah(visibleVouchers[0].minimumPurchase)}`
                  : ""}
              </p>
            </div>
            <Link
              href="/vouchers"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
            >
              Lihat Voucher
            </Link>
          </section>
        ) : null}

        <section>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-5 w-1 shrink-0 rounded-full bg-[var(--color-accent)]" />
              <h2 className="text-lg font-bold text-[var(--color-text)]">Produk Unggulan</h2>
            </div>
            <Link
              href="/products"
              className="text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Lihat semua →
            </Link>
          </div>
          {productCards.length > 0 ? (
            <ProductGrid products={productCards} columns={4} />
          ) : (
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-text-muted)]">
              Produk aktif belum tersedia.
            </div>
          )}
        </section>
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

function buildProductWhere(
  categorySlug: string,
  sort: string,
  now: Date,
  features: { voucherEnabled: boolean; flashSaleEnabled: boolean },
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    category: { isActive: true },
    brand: { isActive: true },
  };
  if (categorySlug) where.category = { slug: categorySlug, isActive: true };
  if (sort === "promo") {
    const promoBranches: Prisma.ProductWhereInput[] = [];
    if (features.voucherEnabled) {
      promoBranches.push({
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
    if (features.flashSaleEnabled) {
      promoBranches.push({
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
    if (promoBranches.length > 0) where.OR = promoBranches;
  }
  return where;
}

function productOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "popular") {
    return [
      { inquiryCount: "desc" },
      { clickCount: "desc" },
      { viewCount: "desc" },
      { createdAt: "desc" },
    ];
  }
  return [{ createdAt: "desc" }];
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseSort(value: string) {
  if (value === "popular" || value === "promo") return value;
  return "latest";
}

type ActiveHeroBannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
};

type ResolvedHeroBanner = {
  title: string;
  subtitle: string | null;
  image: string | null;
};

function resolveHeroBanner(rows: ActiveHeroBannerRow[]): ResolvedHeroBanner | null {
  const selected = rows[0] ?? null;

  if (process.env.NODE_ENV !== "production") {
    if (!selected) {
      console.info("[hero-banner] fallback used — no active HeroBanner matched current schedule");
    } else {
      const validImage =
        selected.imageUrl && isRenderablePromoBannerImageUrl(selected.imageUrl);
      console.info("[hero-banner] using HeroBanner", {
        source: "HeroBanner",
        id: selected.id,
        title: selected.title,
        imageUrl: selected.imageUrl,
        imageRenderable: Boolean(validImage),
        imageReason: !selected.imageUrl
          ? "missing image — gradient fallback"
          : validImage
            ? "ok"
            : "invalid path — gradient fallback",
      });
    }
  }

  if (!selected) return null;

  const image =
    selected.imageUrl && isRenderablePromoBannerImageUrl(selected.imageUrl)
      ? selected.imageUrl
      : null;

  return {
    title: selected.title,
    subtitle: selected.subtitle,
    image,
  };
}

function parsePage(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}
