"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DeleteProductButton from "./DeleteProductButton";

type AdminProductRow = {
  id: string;
  name: string;
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
};

function statusLabel(status: string) {
  if (status === "ACTIVE") return { label: "Aktif", className: "bg-success/15 text-success" };
  if (status === "DRAFT") return { label: "Draft", className: "bg-warning/15 text-warning" };
  return { label: "Arsip", className: "bg-border-gray/50 text-text-muted" };
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

function Row({ product }: { product: AdminProductRow }) {
  const router = useRouter();
  const st = statusLabel(product.status);
  const imageSrc = localProductImage(product.primaryImageUrl);

  return (
    <tr
      className="cursor-pointer border-b border-border-gray/50 hover:bg-soft-bg/80"
      onClick={() => router.push(`/admin/products/${product.id}/edit`)}
    >
      <td className="px-3 py-3 text-center text-xs text-text-muted w-8">
        <span className="relative mx-auto block h-8 w-8 overflow-hidden rounded-lg bg-soft-bg">
          {imageSrc ? (
            <Image src={imageSrc} alt="" fill className="object-cover" sizes="2rem" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-primary-maroon">
              {product.name.charAt(0)}
            </div>
          )}
        </span>
      </td>
      <td className="max-w-[200px] truncate px-3 py-3 text-sm font-medium text-text-dark">{product.name}</td>
      <td className="px-3 py-3 text-xs text-text-muted">{product.category?.name ?? "-"}</td>
      <td className="px-3 py-3 text-xs text-text-muted">{product.brand?.name ?? "-"}</td>
      <td className="px-3 py-3 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1">
          <span className={`inline-block h-2 w-2 rounded-full ${
            product.stockStatus === "READY" ? "bg-success" :
            product.stockStatus === "LOW_STOCK" ? "bg-warning" :
            product.stockStatus === "OUT_OF_STOCK" ? "bg-danger" : "bg-soft-teal"
          }`} />
          {product.stockQuantity}
        </span>
      </td>
      <td className="px-3 py-3 text-xs">
        <div className="space-y-0.5">
          <div>
            <span className="text-[10px] text-text-muted">Modal </span>
            <span className="font-mono text-danger">{formatPrice(product.costPrice)}</span>
          </div>
          <div>
            <span className="text-[10px] text-text-muted">Public </span>
            <span className="font-mono font-semibold text-accent-rose">{formatPrice(product.publicPrice)}</span>
          </div>
          <div>
            <span className="text-[10px] text-text-muted">Ritel </span>
            <span className="font-mono font-semibold text-soft-teal">{formatPrice(product.retailPrice)}</span>
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
            className="rounded-lg bg-soft-bg px-2.5 py-1.5 text-[11px] font-semibold text-primary-maroon hover:bg-primary-maroon hover:text-white"
          >
            Edit
          </Link>
          <DeleteProductButton productId={product.id} />
        </div>
      </td>
    </tr>
  );
}

export default function AdminProductsPageClient({ products, pagination }: Props) {
  const firstItem = pagination.totalCount === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const lastItem = Math.min(pagination.page * pagination.pageSize, pagination.totalCount);

  return (
    <main className="min-h-screen bg-soft-bg text-text-dark">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produk</h1>
          <p className="mt-1 text-sm text-text-muted">
            Kelola produk yang tersedia dalam e-katalog.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-maroon px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-maroon/80"
        >
          <Plus size={18} />
          Tambah Produk
        </Link>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border-gray bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-gray bg-soft-bg text-left text-[10px] font-semibold uppercase text-text-muted">
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
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-text-muted">
                  Belum ada produk. Klik &quot;Tambah Produk&quot; untuk mulai.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 ? (
        <div className="mt-4 flex flex-col gap-3 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Menampilkan {firstItem}-{lastItem} dari {pagination.totalCount} produk
          </p>
          <div className="flex gap-2">
            {pagination.page > 1 ? (
              <Link
                href={`/admin/products?page=${pagination.page - 1}`}
                className="rounded-lg border border-border-gray bg-white px-3 py-1.5 text-xs font-semibold text-primary-maroon hover:border-primary-maroon"
              >
                Sebelumnya
              </Link>
            ) : null}
            {pagination.page < pagination.totalPages ? (
              <Link
                href={`/admin/products?page=${pagination.page + 1}`}
                className="rounded-lg border border-border-gray bg-white px-3 py-1.5 text-xs font-semibold text-primary-maroon hover:border-primary-maroon"
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
              className="cursor-pointer rounded-xl border border-border-gray bg-white p-3 shadow-sm"
              onClick={() => { window.location.href = `/admin/products/${product.id}/edit`; }}
            >
              <div className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-soft-bg">
                  {imageSrc ? (
                    <Image src={imageSrc} alt="" fill className="object-cover" sizes="3.5rem" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-primary-maroon">
                      {product.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-dark">{product.name}</p>
                  <p className="text-xs text-text-muted">{product.category?.name ?? "-"} · {product.brand?.name ?? "-"}</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-soft-bg p-2 text-xs">
                <div>
                  <span className="text-text-muted">Modal</span>
                  <p className="font-mono font-semibold text-danger">{formatPrice(product.costPrice)}</p>
                </div>
                <div>
                  <span className="text-text-muted">Public</span>
                  <p className="font-mono font-semibold text-accent-rose">{formatPrice(product.publicPrice)}</p>
                </div>
                <div>
                  <span className="text-text-muted">Ritel</span>
                  <p className="font-mono font-semibold text-soft-teal">{formatPrice(product.retailPrice)}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.className}`}>
                  {st.label}
                </span>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="rounded-lg bg-primary-maroon/10 px-3 py-1.5 text-xs font-semibold text-primary-maroon"
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
