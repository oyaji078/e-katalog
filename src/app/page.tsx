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
import type { PromoBannerAudience } from "@/generated/prisma/client";
import { canUseRetailVoucher, getVisibleVouchers, productCardSelect } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { toProductCardProps } from "@/lib/product-card-mapper";
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

  const promoAudiences: PromoBannerAudience[] = ["PUBLIC"];
  if (user) promoAudiences.push("AUTHENTICATED");
  if (user?.retailStatus === "RETAIL_ACTIVE") promoAudiences.push("RETAIL");

  const newArrivalCutoff = new Date();
  newArrivalCutoff.setDate(newArrivalCutoff.getDate() - NEW_ARRIVAL_DAYS);

  const [categories, recommendedProducts, newArrivalProducts, featuredProducts,
    vouchers, whatsappNumber, flashSaleData, promoBanners, promoEnabled, heroBanners] =
    await Promise.all([
      db.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true },
      }),
      // Rekomendasi Produk: prioritized products then latest
      db.product.findMany({
        where: { status: "ACTIVE" },
        select: productCardSelect,
        orderBy: [{ isRecommended: "desc" }, { createdAt: "desc" }],
        take: 10,
      }),
      // Produk Baru: created within 30 days
      db.product.findMany({
        where: { status: "ACTIVE", createdAt: { gte: newArrivalCutoff } },
        select: productCardSelect,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // Produk Unggulan: manually curated
      db.product.findMany({
        where: { status: "ACTIVE", isFeatured: true },
        select: productCardSelect,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.voucher.findMany({
        where: { isActive: true, status: "ACTIVE" },
        include: {
          categories: { select: { id: true } },
          products: { select: { productId: true } },
        },
        orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
        take: 6,
      }),
      resolveStoreWhatsappNumber(db),
      // Flash Sale: active sales with products
      db.flashSale.findMany({
        where: {
          isActive: true,
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
        },
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true, name: true, slug: true, shortSpecification: true,
                  publicPrice: true, retailPrice: true, primaryImageUrl: true,
                  stockStatus: true, stockQuantity: true, isFeatured: true,
                  isRecommended: true, createdAt: true, categoryId: true,
                  category: { select: { name: true, slug: true } },
                  brand: { select: { name: true } },
                  images: { select: { url: true }, orderBy: { sortOrder: "asc" } },
                },
              },
            },
            orderBy: { sortOrder: "asc" },
            take: 10,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      }),
      db.promoBanner.findMany({
        where: {
          isActive: true,
          audience: { in: promoAudiences },
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
          ],
        },
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

  const mapCards = (products: typeof recommendedProducts) =>
    products.map((p) =>
      toProductCardProps(p, { user, retailPriceEnabled, publicVoucherEnabled, retailVoucherEnabled, vouchers }),
    );

  const recommendedCards = mapCards(recommendedProducts);
  const newArrivalCards = mapCards(newArrivalProducts);
  const featuredCards = mapCards(featuredProducts);

  const flashSaleProducts = flashSaleData.flatMap((fs) =>
    fs.products.map((fp) =>
      toProductCardProps(fp.product, {
        user,
        retailPriceEnabled,
        publicVoucherEnabled,
        retailVoucherEnabled,
        vouchers,
        flashSalePrice: Number(fp.flashSalePrice),
        flashSaleStock: fp.flashSaleStock,
      }),
    ),
  );

  const canSeeRetailVouchers = canUseRetailVoucher(user);
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
      className="min-h-screen text-text-dark"
      style={{ backgroundColor: "#f5f5f7", fontFamily: "'Nunito', 'Plus Jakarta Sans', sans-serif" }}
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
          banners={promoBanners}
          enabled={promoEnabled}
        />

        {user &&
        user.retailStatus !== "RETAIL_ACTIVE" &&
        user.role !== "ADMIN" &&
        user.role !== "SUPER_ADMIN" ? (
          <section className="mt-6 rounded-2xl border border-soft-teal/30 bg-soft-teal/10 p-4 text-sm text-primary-maroon">
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

        {/* 5. Produk Unggulan */}
        {featuredCards.length > 0 ? (
          <Section title="Produk Unggulan" href="/products?filter=unggulan">
            <ProductGrid products={featuredCards} columns={5} />
          </Section>
        ) : null}

        {/* 6. Catalog Teaser */}
        {recommendedCards.length === 0 && newArrivalCards.length === 0 && featuredCards.length === 0 ? (
          <div className="bg-white p-8 text-center text-sm text-text-muted md:rounded-2xl">
            Produk aktif belum tersedia.
          </div>
        ) : null}

        <div className="mb-2 mt-6 flex justify-center md:mx-4">
          <Link
            href="/products"
            className="rounded-full px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95"
            style={{ background: "linear-gradient(135deg, #AE2448, #6E1A37)" }}
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
          className="flex items-center gap-0.5 text-xs font-bold transition-opacity hover:opacity-70"
          style={{ color: "#AE2448" }}
        >
          Lihat Semua <ChevronRight size={13} />
        </Link>
      </div>
      {children}
    </section>
  );
}
