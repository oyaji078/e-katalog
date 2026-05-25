import { ChevronRight } from "lucide-react";
import Link from "next/link";

import FigmaFooter from "@/components/layout/FigmaFooter";
import FigmaSiteHeader from "@/components/layout/FigmaSiteHeader";
import FigmaCategoryGrid from "@/components/ui/FigmaCategoryGrid";
import FigmaFlashSaleSection from "@/components/ui/FigmaFlashSaleSection";
import FigmaHeroCarousel from "@/components/ui/FigmaHeroCarousel";
import FigmaPromoBannerRow from "@/components/ui/FigmaPromoBannerRow";
import FigmaServiceStrip from "@/components/ui/FigmaServiceStrip";
import ProductGrid from "@/components/ui/ProductGrid";
import {
  canSeeRetailPrice,
  canUseRetailVoucher,
  getVisibleVouchers,
  productCardSelect,
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
import { publicPromoBannerSelect, toPublicPromoBanners } from "@/lib/promo-banner-display";
import { bannerVoucherSelect } from "@/lib/banner-voucher";
import { getCurrentUser } from "@/lib/session";
import { buildWhatsappUrl, resolveStoreWhatsappNumber } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const NEW_ARRIVAL_DAYS = 30;

export default async function Home() {
  const db = getDb();

  const [user, retailPriceEnabled, publicVoucherEnabled, retailVoucherEnabled] =
    await Promise.all([
      getCurrentUser().catch(() => null),
      isFeatureEnabled("enable_retail_price"),
      isFeatureEnabled("enable_public_voucher"),
      isFeatureEnabled("enable_retail_voucher"),
    ]);

  const isRetailActive = user?.retailStatus === "RETAIL_ACTIVE";

  const newArrivalCutoff = new Date();
  newArrivalCutoff.setDate(newArrivalCutoff.getDate() - NEW_ARRIVAL_DAYS);

  const trafficOrderBy = [
    { inquiryCount: "desc" as const },
    { clickCount: "desc" as const },
    { viewCount: "desc" as const },
    { createdAt: "desc" as const },
  ];

  const [categories, recommendedProducts, newArrivalProducts, popularProducts,
    vouchers, whatsappNumber, activeFlashSaleProducts, promoBanners, promoEnabled, heroBanners] =
    await Promise.all([
      db.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true, icon: true },
      }),
      // Rekomendasi Produk: traffic first, latest as fallback when traffic is empty.
      db.product.findMany({
        where: { status: "ACTIVE" },
        select: productCardSelect,
        orderBy: trafficOrderBy,
        take: 10,
      }),
      // Produk Baru: created within 30 days
      db.product.findMany({
        where: { status: "ACTIVE", createdAt: { gte: newArrivalCutoff } },
        select: productCardSelect,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // Produk Populer: traffic first, latest as fallback when traffic is empty.
      db.product.findMany({
        where: { status: "ACTIVE" },
        select: productCardSelect,
        orderBy: trafficOrderBy,
        take: 10,
      }),
      db.voucher.findMany({
        where: { isActive: true, status: "ACTIVE" },
        select: voucherWithScopeSelect,
        orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
        take: 6,
      }),
      resolveStoreWhatsappNumber(db),
      db.flashSaleProduct.findMany({
        where: {
          flashSale: {
            isActive: true,
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
        },
        select: activeFlashSaleProductSelect,
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
        select: publicPromoBannerSelect,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 10,
      }),
      isFeatureEnabled("enable_promo_banner"),
      db.heroBanner.findMany({
        where: {
          isActive: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
          ],
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 5,
      }),
    ]);

  const showRetailPrice = canSeeRetailPrice(user, retailPriceEnabled);
  const flashSaleMap = buildActiveFlashSaleMap(activeFlashSaleProducts);
  const mapCards = (products: typeof recommendedProducts) =>
    products.map((p) => {
      const activeFlashSale = flashSaleMap.get(p.id);
      const flashSaleDisplay = getFlashSaleDisplayForViewer(activeFlashSale, showRetailPrice);

      return toProductCardProps(p, {
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

  const recommendedCards = mapCards(recommendedProducts);
  const newArrivalCards = mapCards(newArrivalProducts);
  const popularCards = mapCards(popularProducts);

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
    ? await db.voucher.findMany({
        where: { id: { in: promoBannerVoucherIds } },
        select: bannerVoucherSelect,
      })
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

  return (
    <main
      className="min-h-screen text-brand-text"
      style={{ backgroundColor: "var(--brand-bg)", fontFamily: "'Nunito', 'Plus Jakarta Sans', sans-serif" }}
    >
      <FigmaSiteHeader />

      <div className="mx-auto max-w-7xl pb-20 md:pb-10">
        <FigmaHeroCarousel banners={heroBanners} />
        <FigmaCategoryGrid dbCategories={categories} />
        <FigmaServiceStrip />

        {/* 1. Flash Sale */}
        {flashSaleProducts.length > 0 ? (
          <FigmaFlashSaleSection products={flashSaleProducts.slice(0, 6)} />
        ) : null}

        {/* 2. Promo & Voucher */}
        <FigmaPromoBannerRow
          whatsappUrl={generalWaUrl}
          hasVoucher={visibleVouchers.length > 0}
          banners={publicPromoBanners}
          enabled={promoEnabled}
        />

        {user &&
        user.retailStatus !== "RETAIL_ACTIVE" &&
        user.role !== "ADMIN" &&
        user.role !== "SUPER_ADMIN" ? (
          <section className="mt-6 rounded-2xl border border-brand-secondary/30 bg-brand-secondary/10 p-4 text-sm text-brand-primary">
            Akun ritel Anda belum aktif.{" "}
            {user.retailStatus === "PENDING_RETAIL" ? (
              <Link href="/retail/activate" className="font-black underline">
                Aktivasi token sekarang
              </Link>
            ) : (
              <Link href="/retail/request-token" className="font-black underline">
                Minta token aktivasi
              </Link>
            )}{" "}
            untuk melihat harga khusus ritel.
          </section>
        ) : null}

        {/* 3. Rekomendasi Produk */}
        {recommendedCards.length > 0 ? (
          <Section title="Rekomendasi Produk" href="/products">
            <ProductGrid products={recommendedCards} columns={5} />
          </Section>
        ) : null}

        {/* 4. Produk Baru */}
        {newArrivalCards.length > 0 ? (
          <Section title="Produk Baru" href="/products?sort=terbaru">
            <ProductGrid products={newArrivalCards} columns={5} />
          </Section>
        ) : null}

        {/* 5. Produk Populer */}
        {popularCards.length > 0 ? (
          <Section title="Produk Populer" href="/products?sort=recommended">
            <ProductGrid products={popularCards} columns={5} />
          </Section>
        ) : null}

        {/* 6. Catalog Teaser */}
        {recommendedCards.length === 0 && newArrivalCards.length === 0 && popularCards.length === 0 ? (
          <div className="bg-white p-8 text-center text-sm text-brand-muted md:rounded-2xl">
            Produk aktif belum tersedia.
          </div>
        ) : null}

        <div className="mb-2 mt-6 flex justify-center md:mx-4">
          <Link
            href="/products"
            className="rounded-full bg-brand-primary px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-brand-hover hover:shadow-lg active:scale-95"
          >
            Lihat Lebih Banyak Produk
          </Link>
        </div>

        <FigmaFooter />
      </div>
    </main>
  );
}

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="mt-2 md:mx-4 md:mt-4">
      <div className="flex items-center justify-between bg-white px-4 pb-3 pt-4 md:rounded-t-2xl">
        <h2 className="text-base font-black text-gray-900 md:text-lg">{title}</h2>
        <Link
          href={href}
          className="flex items-center gap-0.5 text-xs font-bold text-brand-primary transition-opacity hover:opacity-70"
        >
          Lihat Semua <ChevronRight size={13} />
        </Link>
      </div>
      {children}
    </section>
  );
}
