import type { Prisma, StockStatus } from "@/generated/prisma/client";
import { Filter, Search } from "lucide-react";
import Link from "next/link";

import ProductGrid from "@/components/ui/ProductGrid";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { toProductCardProps } from "@/lib/product-card-mapper";
import { getCurrentSession } from "@/lib/session";
import { buildWhatsappUrl, getStoreWhatsappNumber } from "@/lib/whatsapp";

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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const q = firstParam(params.q);
  const category = firstParam(params.category);
  const brand = firstParam(params.brand);
  const stock = parseStock(firstParam(params.stock));
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

  const filters: Prisma.ProductWhereInput[] = [];
  if (q) {
    filters.push({
      OR: [
        { name: { contains: q } },
        { sku: { contains: q } },
        { description: { contains: q } },
        { shortSpecification: { contains: q } },
      ],
    });
  }
  if (category) filters.push({ category: { slug: category } });
  if (brand) filters.push({ brand: { slug: brand } });
  if (stock) filters.push({ stockStatus: stock });

  const [categories, brands, products, vouchers] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.brand.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.product.findMany({
      where: {
        status: "ACTIVE",
        AND: filters,
      },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
    db.voucher.findMany({
      where: { isActive: true, status: "ACTIVE" },
      include: {
        categories: { select: { id: true } },
        products: { select: { productId: true } },
      },
      orderBy: { createdAt: "desc" },
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

  return (
    <main className="min-h-screen bg-soft-bg text-text-dark">
      <section className="border-b border-border-gray bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-text-muted sm:px-6">
          <span>Garansi toko dan dukungan WhatsApp</span>
          <div className="hidden items-center gap-5 sm:flex">
            <Link href="/vouchers">Voucher</Link>
            <Link href="/login" className="font-semibold text-primary-maroon">
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
              defaultValue={q}
              aria-label="Cari produk"
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Cari laptop, monitor, keyboard, printer..."
            />
          </form>
          <a
            href={generalWaUrl}
            className="rounded-md bg-whatsapp-green px-4 py-2 text-sm font-semibold text-white"
          >
            WhatsApp
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Produk Komputer & Aksesoris Elektronik</h1>
            <p className="mt-2 text-sm text-text-muted">
              Pilih produk, cek harga yang tersedia, lalu inquiry melalui WhatsApp.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-border-gray bg-white px-3 py-2 text-sm text-text-muted sm:flex">
            <Filter className="size-4" />
            {productCards.length} produk
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-lg border border-border-gray bg-white p-4 shadow-sm">
            <form action="/products" className="grid gap-4">
              <input type="hidden" name="q" value={q} />
              <SelectFilter label="Kategori" name="category" value={category}>
                <option value="">Semua kategori</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </SelectFilter>
              <SelectFilter label="Brand" name="brand" value={brand}>
                <option value="">Semua brand</option>
                {brands.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </SelectFilter>
              <SelectFilter label="Stok" name="stock" value={stock ?? ""}>
                <option value="">Semua status</option>
                {stockStatuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </SelectFilter>
              <button
                type="submit"
                className="rounded-md bg-primary-maroon px-4 py-3 text-sm font-bold text-white"
              >
                Terapkan Filter
              </button>
              <Link
                href="/products"
                className="rounded-md border border-primary-maroon px-4 py-3 text-center text-sm font-bold text-primary-maroon"
              >
                Reset
              </Link>
            </form>
          </aside>

          <section className="w-full">
            {productCards.length > 0 ? (
              <ProductGrid products={productCards} columns={4} />
            ) : (
              <div className="rounded-lg border border-border-gray bg-white p-8 text-center text-sm text-text-muted">
                Produk tidak ditemukan untuk filter ini.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
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
    <label className="block text-sm font-semibold">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="mt-2 w-full rounded-md border border-border-gray px-3 py-2 text-sm outline-none focus:border-primary-maroon"
      >
        {children}
      </select>
    </label>
  );
}
