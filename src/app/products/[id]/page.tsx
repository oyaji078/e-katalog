import {
  BadgePercent,
  CheckCircle,
  ChevronLeft,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import FigmaFooter from "@/components/layout/FigmaFooter";
import ProductImageGallery from "@/components/ui/ProductImageGallery";
import ProductGrid from "@/components/ui/ProductGrid";
import ProductTrafficTracker from "@/components/ui/ProductTrafficTracker";
import FigmaSiteHeader from "@/components/layout/FigmaSiteHeader";
import VoucherClaimButton from "@/components/ui/VoucherClaimButton";
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
  stockLabel,
  voucherLabel,
} from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { buildActiveFlashSaleMap, getFlashSaleDisplayForViewer } from "@/lib/flash-sale";
import { toProductCardProps } from "@/lib/product-card-mapper";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function isSafeReturnUrl(url: string | null): boolean {
  if (!url) return false;
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  if (url.includes("http://") || url.includes("https://")) return false;
  return true;
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const requestedReturnUrl = firstParam(sp.returnUrl);
  const returnUrl = isSafeReturnUrl(requestedReturnUrl) ? requestedReturnUrl : "/products";
  const db = getDb();
  const [user, retailPriceEnabled, publicVoucherEnabled, retailVoucherEnabled] =
    await Promise.all([
      getCurrentUser().catch(() => null),
      isFeatureEnabled("enable_retail_price"),
      isFeatureEnabled("enable_public_voucher"),
      isFeatureEnabled("enable_retail_voucher"),
    ]);

  let product = await db.product.findFirst({
    where: { slug: id, status: "ACTIVE" },
    select: productDetailSelect,
  });

  if (!product) {
    product = await db.product.findFirst({
      where: { id, status: "ACTIVE" },
      select: productDetailSelect,
    });
  }

  if (!product) notFound();

  const [vouchers, relatedProducts, activeFlashSaleProducts, claims] = await Promise.all([
    db.voucher.findMany({
      where: { isActive: true, status: "ACTIVE" },
      include: {
        categories: { select: { id: true } },
        products: { select: { productId: true } },
      },
      orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
    }),
    db.product.findMany({
      where: {
        status: "ACTIVE",
        categoryId: product.categoryId,
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
    user
      ? db.voucherClaim.findMany({
          where: { userId: user.id, status: "CLAIMED" },
          select: { voucherId: true },
        })
      : Promise.resolve([]),
  ]);

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
  const claimedIds = new Set(claims.map((claim) => claim.voucherId));
  const claimedVisibleVouchers = visibleVouchers.filter((voucher) => claimedIds.has(voucher.id));
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
  const detailBadge = flashSaleDisplay ? "Flash Sale" : visibleVouchers.length > 0 ? "Promo" : productBadge(product);

  return (
    <main className="min-h-screen bg-brand-bg pb-20 text-brand-text lg:pb-8">
      <ProductTrafficTracker productId={product.id} />
      <FigmaSiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link
          href={returnUrl}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-brand-primary shadow-sm transition hover:bg-brand-primary hover:text-white"
        >
          <ChevronLeft className="size-4" />
          Kembali ke Katalog
        </Link>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative">
            <ProductImageGallery
              images={gallery}
              productName={product.name}
              categoryName={product.category.name}
            />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {detailBadge ? (
                <span className="rounded-full bg-brand-primary px-3 py-1 text-xs font-black text-white">
                  {detailBadge}
                </span>
              ) : null}
            </div>
          </div>

          <section className="rounded-3xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-secondary/15 px-3 py-1 text-xs font-black text-brand-primary">
                {product.category.name}
              </span>
              <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-black text-brand-primary">
                {product.brand.name}
              </span>
              <span className="rounded-full bg-brand-bg px-3 py-1 text-xs font-bold text-brand-muted">
                SKU {product.sku}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-black leading-tight text-brand-text">
              {product.name}
            </h1>
            {product.shortSpecification ? (
              <p className="mt-3 text-sm leading-6 text-brand-muted">
                {product.shortSpecification}
              </p>
            ) : null}

            <div className="mt-5 rounded-3xl border border-brand-primary/10 bg-brand-bg p-4">
              {flashSaleDisplay ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-black text-brand-accent">
                    <BadgePercent className="size-4" />
                    Harga Flash Sale
                  </div>
                  <p className="mt-3 text-3xl font-black leading-tight text-brand-accent">
                    {formatRupiah(flashSaleDisplay.price)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-muted line-through">
                    {showRetail && product.retailPrice
                      ? formatRupiah(product.retailPrice)
                      : formatRupiah(product.publicPrice)}
                  </p>
                </>
              ) : showRetail && product.retailPrice ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-secondary/20 px-3 py-1 text-xs font-black text-brand-primary">
                    <CheckCircle className="size-4 text-brand-secondary" />
                    Harga Khusus Ritel Aktif
                  </div>
                  <p className="mt-3 text-3xl font-black leading-tight text-brand-primary">
                    {formatRupiah(product.retailPrice)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-muted line-through">
                    {formatRupiah(product.publicPrice)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-black text-brand-muted">Harga publik</p>
                  <p className="mt-1 text-3xl font-black leading-tight text-brand-accent">
                    {formatRupiah(product.publicPrice)}
                  </p>
                  {product.retailPrice ? (
                    <p className="mt-2 text-xs font-semibold text-brand-muted">
                      Aktifkan akun ritel untuk melihat harga khusus.
                    </p>
                  ) : null}
                </>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-brand-border p-4">
                <div className="flex items-center gap-2 text-sm font-black text-brand-text">
                  <PackageCheck className="size-5 text-brand-secondary" />
                  Stok
                </div>
                <p className="mt-2 text-sm font-semibold text-brand-muted">{stockLabel(product)}</p>
              </div>
              <div className="rounded-2xl border border-brand-border p-4">
                <div className="flex items-center gap-2 text-sm font-black text-brand-text">
                  <ShieldCheck className="size-5 text-brand-secondary" />
                  Garansi
                </div>
                <p className="mt-2 text-sm font-semibold text-brand-muted">
                  {product.warrantyInfo ?? "Garansi toko sesuai produk."}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-brand-accent/20 bg-brand-accent/5 p-4">
              <div className="flex items-center gap-2">
                <BadgePercent className="size-5 text-brand-accent" />
                <h2 className="text-sm font-black text-brand-accent">Voucher Produk</h2>
              </div>
              {visibleVouchers.length > 0 ? (
                <div className="mt-3 grid gap-3">
                  {visibleVouchers.map((voucher) => {
                    const isClaimed = claimedIds.has(voucher.id);
                    return (
                      <div
                        key={voucher.id}
                        className="grid gap-3 rounded-2xl border border-brand-accent/15 bg-white p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <div>
                          <p className="text-sm font-black text-brand-text">
                            {isClaimed ? `${voucher.code} - ` : ""}{voucher.title}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-brand-muted">
                            {voucherLabel(voucher)} berlaku sampai{" "}
                            {new Intl.DateTimeFormat("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }).format(voucher.endsAt)}
                          </p>
                        </div>
                        <VoucherClaimButton
                          voucherId={voucher.id}
                          isAuthenticated={!!user}
                          isClaimed={isClaimed}
                          canClaim={voucher.showForPublic || (voucher.showForRetail && canSeeRetailVouchers)}
                          disabledReason={
                            !voucher.showForPublic && voucher.showForRetail && !canSeeRetailVouchers
                              ? "Khusus akun ritel aktif."
                              : undefined
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-brand-muted">
                  Voucher belum tersedia untuk produk ini. Cek halaman voucher untuk promo katalog
                  lain.
                </p>
              )}
              {claimedVisibleVouchers.length > 0 ? (
                <p className="mt-3 text-xs font-semibold text-brand-primary">
                  Voucher terklaim akan otomatis dimasukkan ke pesan WhatsApp.
                </p>
              ) : null}
            </div>

            <WhatsAppInquiryButton
              productId={product.id}
              productSlug={product.slug ?? undefined}
              sourcePage="product-detail"
              label="Tanya Produk via WhatsApp"
              className="mt-5 w-full rounded-2xl px-4 py-3.5 text-sm font-bold shadow-lg"
            />
          </section>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-border bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] lg:hidden">
          <WhatsAppInquiryButton
            productId={product.id}
            productSlug={product.slug ?? undefined}
            sourcePage="product-detail"
            label="Tanya via WhatsApp"
            className="w-full rounded-xl px-4 py-3 text-sm font-bold shadow-md"
          />
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-brand-border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Deskripsi Produk</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-brand-muted">
              {product.description}
            </p>
          </div>
          <div className="rounded-3xl border border-brand-border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Spesifikasi Teknis</h2>
            {specs.length > 0 ? (
              <dl className="mt-4 grid gap-2 text-sm">
                {specs.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[120px_1fr] gap-3 rounded-2xl bg-brand-bg px-3 py-2"
                  >
                    <dt className="font-black text-brand-text">{label}</dt>
                    <dd className="text-brand-muted">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-brand-muted">Spesifikasi belum tersedia.</p>
            )}
          </div>
        </section>

        {relatedCards.length > 0 ? (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-brand-accent">
                  Produk terkait
                </p>
                <h2 className="mt-1 text-2xl font-black text-brand-text">
                  Kategori {product.category.name}
                </h2>
              </div>
              <Link
                href={`/products?category=${product.category.slug}`}
                className="rounded-xl border border-brand-primary/20 bg-white px-4 py-2 text-sm font-black text-brand-primary transition hover:border-brand-primary"
              >
                Lihat kategori
              </Link>
            </div>
            <ProductGrid products={relatedCards} columns={5} />
          </section>
        ) : null}
      </div>
      <FigmaFooter />
    </main>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
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
