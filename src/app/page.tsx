import {
  BadgePercent,
  Headphones,
  Laptop,
  Monitor,
  Mouse,
  Search,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import Link from "next/link";

import ProductGrid from "@/components/ui/ProductGrid";
import { formatRupiah, getVisibleVouchers, voucherLabel } from "@/lib/catalog";
import { buildWhatsappUrl, getStoreWhatsappNumber } from "@/lib/whatsapp";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { toProductCardProps } from "@/lib/product-card-mapper";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const categoryIcons = [Laptop, Monitor, Headphones, Mouse, Smartphone];

export default async function Home() {
  const db = getDb();

  const generalInquiryMessage =
    "Halo Admin, saya ingin bertanya tentang produk yang tersedia di katalog.";
  const generalWaUrl = buildWhatsappUrl({
    message: generalInquiryMessage,
    whatsappNumber: getStoreWhatsappNumber(),
  });
  const [session, retailPriceEnabled, publicVoucherEnabled, retailVoucherEnabled] =
    await Promise.all([
      getCurrentSession().catch(() => null),
      isFeatureEnabled("enable_retail_price"),
      isFeatureEnabled("enable_public_voucher"),
      isFeatureEnabled("enable_retail_voucher"),
    ]);

  const [categories, products, vouchers] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 8,
    }),
    db.product.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ isRecommended: "desc" }, { isNewArrival: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    db.voucher.findMany({
      where: {
        isActive: true,
        status: "ACTIVE",
      },
      include: {
        categories: { select: { id: true } },
        products: { select: { productId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
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
  const visibleVouchers = getVisibleVouchers(vouchers, {
    publicVoucherEnabled,
    retailVoucherEnabled,
    canSeeRetail: session?.user?.retailStatus === "RETAIL_ACTIVE",
  });

  return (
    <main className="min-h-screen bg-soft-bg text-text-dark">
      <section className="border-b border-border-gray bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-text-muted sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-soft-teal" />
            <span>Garansi toko dan dukungan WhatsApp</span>
          </div>
          <div className="hidden items-center gap-5 sm:flex">
            <Link href="/products">Produk</Link>
            <Link href="/vouchers">Voucher</Link>
            <Link className="font-semibold text-primary-maroon" href="/login">
              Retail Login
            </Link>
          </div>
        </div>
      </section>

      <header className="sticky top-0 z-20 border-b border-border-gray bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center">
          <Link href="/" className="text-xl font-bold text-primary-maroon">
            E-Katalog Komputer
          </Link>
          <form
            action="/products"
            className="flex flex-1 items-center rounded-lg border border-border-gray bg-white px-4 py-3 shadow-sm lg:mx-5"
          >
            <Search className="mr-3 size-5 text-text-muted" />
            <input
              name="q"
              aria-label="Cari produk"
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Cari laptop, monitor, keyboard, printer..."
            />
          </form>
          <div className="flex gap-2">
            <Link
              href="/register"
              className="rounded-md border border-primary-maroon px-4 py-2 text-sm font-semibold text-primary-maroon"
            >
              Daftar Retail
            </Link>
            <a
              href={generalWaUrl}
              className="rounded-md bg-whatsapp-green px-4 py-2 text-sm font-semibold text-white"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
          <div className="rounded-lg bg-primary-maroon p-6 text-white shadow-sm">
            <p className="text-sm font-semibold text-white/80">Promo Komputer & Aksesoris</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
              Katalog produk siap inquiry untuk kebutuhan kerja, gaming, dan toko retail.
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-primary-maroon"
              >
                Jelajahi Produk
              </Link>
              <a
                href={generalWaUrl}
                className="rounded-md bg-whatsapp-green px-4 py-2 text-sm font-semibold text-white"
              >
                Tanya via WhatsApp
              </a>
            </div>
          </div>
          <div className="rounded-lg border border-border-gray bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-accent-rose">
              <BadgePercent className="size-6" />
              <p className="font-semibold">Voucher Aktif</p>
            </div>
            {visibleVouchers[0] ? (
              <div className="mt-5 rounded-lg border border-accent-rose/20 bg-accent-rose/5 p-4">
                <p className="text-sm font-bold text-accent-rose">
                  {visibleVouchers[0].title}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Diskon {voucherLabel(visibleVouchers[0])}
                  {visibleVouchers[0].minimumPurchase
                    ? `, minimum ${formatRupiah(visibleVouchers[0].minimumPurchase)}`
                    : ""}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-text-muted">
                Voucher publik dan retail dikontrol oleh feature flag database.
              </p>
            )}
            <Link href="/vouchers" className="mt-4 inline-block text-sm font-bold text-primary-maroon">
              Lihat voucher
            </Link>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category, index) => {
            const Icon = categoryIcons[index % categoryIcons.length];
            return (
              <Link
                href={`/categories/${category.slug}`}
                key={category.id}
                className="rounded-lg border border-border-gray bg-white p-4 shadow-sm"
              >
                <Icon className="mb-3 size-6 text-soft-teal" />
                <p className="font-semibold">{category.name}</p>
              </Link>
            );
          })}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Produk Rekomendasi</h2>
            <Link href="/products" className="text-sm font-semibold text-primary-maroon">
              Lihat semua
            </Link>
          </div>
          {productCards.length > 0 ? (
            <ProductGrid products={productCards} columns={4} />
          ) : (
            <div className="rounded-lg border border-border-gray bg-white p-6 text-sm text-text-muted">
              Produk aktif belum tersedia.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
