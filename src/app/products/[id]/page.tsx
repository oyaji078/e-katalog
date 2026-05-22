import { Laptop } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import WhatsAppInquiryButton from "@/components/ui/WhatsAppInquiryButton";
import ProductGrid from "@/components/ui/ProductGrid";
import {
  canSeeRetailPrice,
  formatRupiah,
  getApplicableVouchers,
  getVisibleVouchers,
  productBadge,
  voucherLabel,
} from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { toProductCardProps } from "@/lib/product-card-mapper";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const db = getDb();
  const [session, retailPriceEnabled, publicVoucherEnabled, retailVoucherEnabled] =
    await Promise.all([
      getCurrentSession().catch(() => null),
      isFeatureEnabled("enable_retail_price"),
      isFeatureEnabled("enable_public_voucher"),
      isFeatureEnabled("enable_retail_voucher"),
    ]);

  // Try to find product by slug first, then by ID (for backward compatibility)
  let product = await db.product.findFirst({
    where: { slug: id, status: "ACTIVE" },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  // If not found by slug, try by ID
  if (!product) {
    product = await db.product.findFirst({
      where: { id, status: "ACTIVE" },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  if (!product) notFound();

  const [vouchers, relatedProducts] = await Promise.all([
    db.voucher.findMany({
      where: { isActive: true, status: "ACTIVE" },
      include: {
        categories: { select: { id: true } },
        products: { select: { productId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.product.findMany({
      where: {
        status: "ACTIVE",
        categoryId: product.categoryId,
        NOT: { id: product.id },
      },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ isRecommended: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
  ]);

  const showRetail = canSeeRetailPrice(session?.user, retailPriceEnabled);
  const visibleVouchers = getVisibleVouchers(getApplicableVouchers(product, vouchers), {
    publicVoucherEnabled,
    retailVoucherEnabled,
    canSeeRetail: showRetail,
  });
  const relatedCards = relatedProducts.map((item) =>
    toProductCardProps(item, {
      user: session?.user,
      retailPriceEnabled,
      publicVoucherEnabled,
      retailVoucherEnabled,
      vouchers,
    }),
  );
  const gallery = uniqueImages([product.primaryImageUrl, ...product.images.map((image) => image.url)]);
  const specs = specRows(product.specifications);

  return (
    <main className="min-h-screen bg-soft-bg text-text-dark">
      <header className="border-b border-border-gray bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold text-primary-maroon">
            E-Katalog Komputer
          </Link>
          <Link href="/products" className="text-sm font-bold text-primary-maroon">
            Kembali ke produk
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="grid gap-3">
            <div className="aspect-square overflow-hidden rounded-lg border border-border-gray bg-white">
              {gallery[0] ? (
                <div
                  aria-label={product.name}
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${gallery[0]}")` }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-soft-bg">
                  <Laptop className="size-20 text-primary-maroon" />
                </div>
              )}
            </div>
            {gallery.length > 1 ? (
              <div className="grid grid-cols-4 gap-3">
                {gallery.slice(1, 5).map((image) => (
                  <div
                    key={image}
                    aria-label={product.name}
                    className="aspect-square rounded-lg border border-border-gray bg-cover bg-center"
                    style={{ backgroundImage: `url("${image}")` }}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-border-gray bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-soft-teal/15 px-2 py-1 text-xs font-bold text-primary-maroon">
                {productBadge(product)}
              </span>
              <span className="rounded-full bg-primary-maroon/10 px-2 py-1 text-xs font-bold text-primary-maroon">
                {product.category.name}
              </span>
              <span className="rounded-full bg-accent-rose/10 px-2 py-1 text-xs font-bold text-accent-rose">
                {product.brand.name}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold">{product.name}</h1>
            <p className="mt-2 font-mono text-xs text-text-muted">SKU: {product.sku}</p>
            {product.shortSpecification ? (
              <p className="mt-3 text-sm leading-6 text-text-muted">{product.shortSpecification}</p>
            ) : null}

            <div className="mt-5 rounded-lg border border-border-gray bg-soft-bg p-4">
              <p className="text-sm text-text-muted">Harga publik</p>
              <p className="mt-1 text-2xl font-bold text-accent-rose">
                {formatRupiah(product.publicPrice)}
              </p>
              {showRetail && product.retailPrice ? (
                <div className="mt-3 border-t border-border-gray pt-3">
                  <p className="text-sm text-text-muted">Harga retail aktif</p>
                  <p className="text-xl font-bold text-soft-teal">
                    {formatRupiah(product.retailPrice)}
                  </p>
                </div>
              ) : null}
            </div>

            {visibleVouchers.length > 0 ? (
              <div className="mt-4 rounded-lg border border-accent-rose/20 bg-accent-rose/5 p-4">
                <p className="text-sm font-bold text-accent-rose">Voucher berlaku</p>
                <div className="mt-2 grid gap-2">
                  {visibleVouchers.map((voucher) => (
                    <p key={voucher.id} className="text-sm text-text-muted">
                      {voucher.title}: {voucherLabel(voucher)}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid gap-2 text-sm">
              <p>
                <span className="font-semibold">Stok:</span> {product.stockStatus} (
                {product.stockQuantity})
              </p>
              {product.warrantyInfo ? (
                <p>
                  <span className="font-semibold">Garansi:</span> {product.warrantyInfo}
                </p>
              ) : null}
            </div>

            <WhatsAppInquiryButton
              productId={product.id}
              productSlug={product.slug ?? undefined}
              sourcePage="product-detail"
              label="Tanya Produk via WhatsApp"
              className="mt-5 block w-full px-4 py-3 text-sm"
            />
          </section>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-lg border border-border-gray bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Deskripsi</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text-muted">
              {product.description}
            </p>
          </div>
          <div className="rounded-lg border border-border-gray bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Spesifikasi Teknis</h2>
            {specs.length > 0 ? (
              <dl className="mt-3 grid gap-2 text-sm">
                {specs.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[130px_1fr] gap-3">
                    <dt className="font-semibold text-text-dark">{label}</dt>
                    <dd className="text-text-muted">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-text-muted">Spesifikasi belum tersedia.</p>
            )}
          </div>
        </section>

        {relatedCards.length > 0 ? (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Produk terkait</h2>
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-sm font-bold text-primary-maroon"
              >
                Lihat kategori
              </Link>
            </div>
            <ProductGrid products={relatedCards} columns={4} />
          </section>
        ) : null}
      </div>
    </main>
  );
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
