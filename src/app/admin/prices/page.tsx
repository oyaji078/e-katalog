import Link from "next/link";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

type AdminPricesPageProps = {
  searchParams: Promise<{ page?: string; limit?: string }>;
};

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

function pricesPageHref(page: number, limit: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  return `/admin/prices?${params.toString()}`;
}

export default async function AdminPricesPage({ searchParams }: AdminPricesPageProps) {
  const session = await getAdminSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
        <section className="mx-auto max-w-md rounded-lg border border-brand-border bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Tidak memiliki akses</p>
          <Link href="/" className="mt-4 block text-center text-brand-primary">
            Ke Halaman Utama
          </Link>
        </section>
      </main>
    );
  }

  const params = await searchParams;
  const requestedPage = parsePositiveInt(params.page, 1);
  const limit = Math.min(parsePositiveInt(params.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const db = getDb();
  const totalCount = await db.product.count();
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const page = Math.min(requestedPage, totalPages);
  const products = await db.product.findMany({
    include: { brand: true, category: true },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
    skip: (page - 1) * limit,
  });
  const firstItem = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, totalCount);

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="mb-4 rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
            <strong>Halaman ini akan dipindahkan.</strong> Pengaturan harga sekarang tersedia di menu{" "}
            <Link href="/admin/products" className="font-bold underline">Produk</Link>.
          </div>
          <h1 className="text-2xl font-bold">Harga &amp; Margin</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Tabel harga produk. Edit harga dan margin di halaman{" "}
            <Link href="/admin/products" className="font-semibold text-brand-primary">Produk</Link>.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-brand-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-border text-sm">
              <thead className="bg-[#EEF4F7] text-xs uppercase tracking-wide text-[#111827]">
                <tr>
                  <th className="px-4 py-3 text-left">Produk</th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Harga Barang</th>
                  <th className="px-4 py-3 text-left">Margin Publik</th>
                  <th className="px-4 py-3 text-left">Harga Publik</th>
                  <th className="px-4 py-3 text-left">Margin Ritel</th>
                  <th className="px-4 py-3 text-left">Harga Ritel</th>
                  <th className="px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-brand-text">{product.name}</p>
                      <p className="text-xs text-brand-muted">
                        {product.category?.name ?? "-"} / {product.brand?.name ?? "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-muted">{product.sku}</td>
                    <td className="px-4 py-3 font-mono text-brand-muted">
                      Rp {Number(product.costPrice).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-mono text-brand-muted">
                      Rp {Number(product.publicMarginValue).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-brand-primary">
                      Rp {Number(product.publicPrice).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-mono text-brand-muted">
                      Rp {Number(product.retailMarginValue).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-brand-secondary">
                      {product.retailPrice
                        ? `Rp ${Number(product.retailPrice).toLocaleString("id-ID")}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-xs font-bold text-brand-primary"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-brand-muted">
                      Belum ada produk.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-brand-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Menampilkan {firstItem}-{lastItem} dari {totalCount} produk
          </p>
          {totalPages > 1 ? (
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={pricesPageHref(page - 1, limit)}
                  className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
                >
                  Sebelumnya
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link
                  href={pricesPageHref(page + 1, limit)}
                  className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
                >
                  Selanjutnya
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
