"use client";

import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DeleteProductButton from "./DeleteProductButton";

type AdminProductRow = {
  id: string;
  name: string;
  sku: string;
  slug: string | null;
  primaryImageUrl: string | null;
  costPrice: string;
  publicPrice: string;
  retailPrice: string | null;
  stockQuantity: number;
  stockStatus: string;
  status: string;
  category?: { name: string } | null;
  brand?: { name: string } | null;
};

type Props = {
  products: AdminProductRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  filters: {
    search: string;
    category: string;
    brand: string;
    status: string;
    stock: string;
    flag: string;
    minPrice: string;
    maxPrice: string;
    createdFrom: string;
    createdTo: string;
  };
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
};

function statusLabel(status: string) {
  if (status === "ACTIVE") return { label: "Aktif", className: "bg-success/15 text-success" };
  if (status === "DRAFT") return { label: "Draft", className: "bg-warning/15 text-brand-on-light" };
  return { label: "Arsip", className: "bg-[rgba(13,11,97,0.08)] text-brand-muted-on-light" };
}

function formatPrice(val: string | null | undefined) {
  if (!val) return "-";
  const num = Number(val);
  if (!Number.isFinite(num)) return val;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

function localProductImage(value: string | null) {
  return value?.startsWith("/uploads/products/") ? value : null;
}

function pageHref(page: number, filters: Props["filters"]) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  params.set("page", String(page));
  return `/admin/products?${params.toString()}`;
}

function Row({ product }: { product: AdminProductRow }) {
  const router = useRouter();
  const st = statusLabel(product.status);
  const imageSrc = localProductImage(product.primaryImageUrl);

  return (
    <tr
      className="cursor-pointer border-b border-brand-light hover:bg-[rgba(13,11,97,0.06)]"
      onClick={() => router.push(`/admin/products/${product.id}/edit`)}
    >
      <td className="px-3 py-3 text-center text-xs text-brand-muted-on-light w-8">
        <span className="relative mx-auto block h-8 w-8 overflow-hidden rounded-lg bg-[rgba(13,11,97,0.08)]">
          {imageSrc ? (
            <Image src={imageSrc} alt="" fill className="object-cover" sizes="2rem" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-brand-on-light">
              {product.name.charAt(0)}
            </div>
          )}
        </span>
      </td>
      <td className="max-w-[200px] truncate px-3 py-3 text-sm font-medium text-brand-on-light">
        {product.name}
        <p className="mt-0.5 font-mono text-[10px] text-brand-muted-on-light">{product.sku}</p>
      </td>
      <td className="px-3 py-3 text-xs text-brand-muted-on-light">{product.category?.name ?? "-"}</td>
      <td className="px-3 py-3 text-xs text-brand-muted-on-light">{product.brand?.name ?? "-"}</td>
      <td className="px-3 py-3 text-xs text-brand-muted-on-light">
        <span className="inline-flex items-center gap-1">
          <span className={`inline-block h-2 w-2 rounded-full ${
            product.stockStatus === "READY" ? "bg-success" :
            product.stockStatus === "LOW_STOCK" ? "bg-warning" :
            product.stockStatus === "OUT_OF_STOCK" ? "bg-danger" : "bg-brand-secondary"
          }`} />
          {product.stockQuantity}
        </span>
      </td>
      <td className="px-3 py-3 text-xs">
        <div className="space-y-0.5">
          <div>
            <span className="text-[10px] text-brand-muted-on-light">Modal </span>
            <span className="font-mono text-brand-muted-on-light">{formatPrice(product.costPrice)}</span>
          </div>
          <div>
            <span className="text-[10px] text-brand-muted-on-light">Public </span>
            <span className="font-mono font-semibold text-brand-on-light">{formatPrice(product.publicPrice)}</span>
          </div>
          <div>
            <span className="text-[10px] text-brand-muted-on-light">Ritel </span>
            <span className="font-mono font-semibold text-[#111827]">{formatPrice(product.retailPrice)}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.className}`}>
          {st.label}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="rounded-lg bg-brand-accent px-2.5 py-1.5 text-[11px] font-bold text-brand-on-accent hover:bg-brand-accent-hover"
          >
            Edit
          </Link>
          <DeleteProductButton productId={product.id} />
        </div>
      </td>
    </tr>
  );
}

export default function AdminProductsPageClient({ products, pagination, filters, categories, brands }: Props) {
  const firstItem = pagination.totalCount === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const lastItem = Math.min(pagination.page * pagination.pageSize, pagination.totalCount);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produk</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Kelola produk yang tersedia dalam e-katalog.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-bold text-brand-on-accent transition hover:bg-brand-accent-hover"
        >
          <Plus size={18} />
          Tambah Produk
        </Link>
      </div>

      <form
        action="/admin/products"
        method="get"
        className="mb-4 rounded-xl border border-brand-light bg-brand-soft-white p-4 text-brand-on-light shadow-sm"
      >
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-brand-muted-on-light" />
          <h2 className="text-sm font-bold">Cari dan filter produk</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-12">
          <label className="lg:col-span-4">
            <span className="mb-1 block text-xs font-semibold text-brand-muted-on-light">Nama / kode produk</span>
            <div className="flex items-center rounded-lg border border-brand-light bg-white px-3">
              <Search size={16} className="text-brand-muted-on-light" />
              <input
                name="search"
                defaultValue={filters.search}
                placeholder="Cari nama, SKU, kategori, merek"
                className="min-h-10 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-brand-muted-on-light"
              />
            </div>
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-brand-muted-on-light">Kategori</span>
            <select
              name="category"
              defaultValue={filters.category}
              className="min-h-10 w-full rounded-lg border border-brand-light bg-white px-3 text-sm outline-none"
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-brand-muted-on-light">Merek</span>
            <select
              name="brand"
              defaultValue={filters.brand}
              className="min-h-10 w-full rounded-lg border border-brand-light bg-white px-3 text-sm outline-none"
            >
              <option value="">Semua merek</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-brand-muted-on-light">Status</span>
            <select
              name="status"
              defaultValue={filters.status}
              className="min-h-10 w-full rounded-lg border border-brand-light bg-white px-3 text-sm outline-none"
            >
              <option value="">Semua status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Arsip</option>
            </select>
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-brand-muted-on-light">Stok</span>
            <select
              name="stock"
              defaultValue={filters.stock}
              className="min-h-10 w-full rounded-lg border border-brand-light bg-white px-3 text-sm outline-none"
            >
              <option value="">Semua stok</option>
              <option value="READY">Ready</option>
              <option value="LOW_STOCK">Menipis</option>
              <option value="OUT_OF_STOCK">Habis</option>
              <option value="PREORDER">Preorder</option>
            </select>
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-brand-muted-on-light">Sorotan</span>
            <select
              name="flag"
              defaultValue={filters.flag}
              className="min-h-10 w-full rounded-lg border border-brand-light bg-white px-3 text-sm outline-none"
            >
              <option value="">Semua produk</option>
              <option value="active">Aktif publik</option>
              <option value="featured">Featured</option>
              <option value="recommended">Rekomendasi</option>
            </select>
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-brand-muted-on-light">Harga min</span>
            <input
              type="number"
              min="0"
              name="minPrice"
              defaultValue={filters.minPrice}
              className="min-h-10 w-full rounded-lg border border-brand-light bg-white px-3 text-sm outline-none"
            />
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-brand-muted-on-light">Harga max</span>
            <input
              type="number"
              min="0"
              name="maxPrice"
              defaultValue={filters.maxPrice}
              className="min-h-10 w-full rounded-lg border border-brand-light bg-white px-3 text-sm outline-none"
            />
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-brand-muted-on-light">Dibuat dari</span>
            <input
              type="date"
              name="createdFrom"
              defaultValue={filters.createdFrom}
              className="min-h-10 w-full rounded-lg border border-brand-light bg-white px-3 text-sm outline-none"
            />
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-brand-muted-on-light">Dibuat sampai</span>
            <input
              type="date"
              name="createdTo"
              defaultValue={filters.createdTo}
              className="min-h-10 w-full rounded-lg border border-brand-light bg-white px-3 text-sm outline-none"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-brand-muted-on-light">
            Menampilkan {firstItem}-{lastItem} dari {pagination.totalCount} produk
          </p>
          <div className="flex flex-wrap gap-2">
            {hasFilters ? (
              <Link
                href="/admin/products"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-brand-light px-4 text-xs font-bold text-brand-on-light hover:border-brand-accent"
              >
                <X size={14} />
                Reset
              </Link>
            ) : null}
            <button
              type="submit"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-primary px-4 text-xs font-bold text-brand-on-dark hover:bg-brand-primary-hover"
            >
              <Search size={14} />
              Terapkan Filter
            </button>
          </div>
        </div>
      </form>

      <div className="hidden overflow-x-auto rounded-xl border border-brand-light bg-brand-soft-white text-brand-on-light shadow-sm md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#D7DEE8] bg-[#EEF4F7] text-left text-[10px] font-semibold uppercase text-[#111827]">
              <th className="w-10 px-3 py-3">Gambar</th>
              <th className="px-3 py-3">Nama Produk</th>
              <th className="px-3 py-3">Kategori</th>
              <th className="px-3 py-3">Merek</th>
              <th className="px-3 py-3">Stok</th>
              <th className="px-3 py-3">Harga</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <Row key={product.id} product={product} />
            ))}
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-brand-muted-on-light">
                  {hasFilters ? "Tidak ada produk yang cocok dengan filter." : "Belum ada produk. Klik \"Tambah Produk\" untuk mulai."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 ? (
        <div className="mt-4 flex flex-col gap-3 text-sm text-brand-muted-on-dark sm:flex-row sm:items-center sm:justify-between">
          <p>
            Menampilkan {firstItem}-{lastItem} dari {pagination.totalCount} produk
          </p>
          <div className="flex gap-2">
            {pagination.page > 1 ? (
              <Link
                href={pageHref(pagination.page - 1, filters)}
                className="rounded-lg border border-brand-light bg-brand-soft-white px-3 py-1.5 text-xs font-semibold text-brand-on-light hover:border-brand-accent"
              >
                Sebelumnya
              </Link>
            ) : null}
            {pagination.page < pagination.totalPages ? (
              <Link
                href={pageHref(pagination.page + 1, filters)}
                className="rounded-lg border border-brand-light bg-brand-soft-white px-3 py-1.5 text-xs font-semibold text-brand-on-light hover:border-brand-accent"
              >
                Selanjutnya
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Mobile cards */}
      <div className="mt-4 grid gap-3 md:hidden">
        {products.map((product) => {
          const st = statusLabel(product.status);
          const imageSrc = localProductImage(product.primaryImageUrl);
          return (
            <div
              key={product.id}
              className="cursor-pointer rounded-xl border border-brand-light bg-brand-soft-white p-3 text-brand-on-light shadow-sm"
              onClick={() => { window.location.href = `/admin/products/${product.id}/edit`; }}
            >
              <div className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[rgba(13,11,97,0.08)]">
                  {imageSrc ? (
                    <Image src={imageSrc} alt="" fill className="object-cover" sizes="3.5rem" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-brand-on-light">
                      {product.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-on-light">{product.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-brand-muted-on-light">{product.sku}</p>
                  <p className="text-xs text-brand-muted-on-light">{product.category?.name ?? "-"} · {product.brand?.name ?? "-"}</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-[rgba(13,11,97,0.06)] p-2 text-xs">
                <div>
                  <span className="text-brand-muted-on-light">Modal</span>
                  <p className="font-mono font-semibold text-brand-muted-on-light">{formatPrice(product.costPrice)}</p>
                </div>
                <div>
                  <span className="text-brand-muted-on-light">Public</span>
                  <p className="font-mono font-semibold text-brand-on-light">{formatPrice(product.publicPrice)}</p>
                </div>
                <div>
                  <span className="text-brand-muted-on-light">Ritel</span>
                  <p className="font-mono font-semibold text-[#111827]">{formatPrice(product.retailPrice)}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.className}`}>
                  {st.label}
                </span>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-bold text-brand-on-accent"
                  >
                    Edit
                  </Link>
                  <DeleteProductButton productId={product.id} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
