import Link from "next/link";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPricesPage() {
  const session = await getAdminSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
        <section className="mx-auto max-w-md rounded-lg border border-border-gray bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Tidak memiliki akses</p>
          <Link href="/" className="mt-4 block text-center text-primary-maroon">
            Ke Halaman Utama
          </Link>
        </section>
      </main>
    );
  }

  const db = getDb();
  const [products] = await Promise.all([
    db.product.findMany({
      include: { brand: true, category: true },
      orderBy: [{ updatedAt: "desc" }],
    }),
  ]);

  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="mb-4 rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
            <strong>Halaman ini akan dipindahkan.</strong> Pengaturan harga sekarang tersedia di menu{" "}
            <Link href="/admin/products" className="font-bold underline">Produk</Link>.
          </div>
          <h1 className="text-2xl font-bold">Harga &amp; Margin</h1>
          <p className="mt-2 text-sm text-text-muted">
            Tabel harga produk. Edit harga dan margin di halaman{" "}
            <Link href="/admin/products" className="font-semibold text-primary-maroon">Produk</Link>.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border-gray bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-gray text-sm">
              <thead className="bg-primary-maroon/5 text-xs uppercase tracking-wide text-primary-maroon">
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
              <tbody className="divide-y divide-border-gray">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-dark">{product.name}</p>
                      <p className="text-xs text-text-muted">
                        {product.category?.name ?? "-"} / {product.brand?.name ?? "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{product.sku}</td>
                    <td className="px-4 py-3 font-mono text-danger">
                      Rp {Number(product.costPrice).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-mono text-text-muted">
                      Rp {Number(product.publicMarginValue).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-accent-rose">
                      Rp {Number(product.publicPrice).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-mono text-text-muted">
                      Rp {Number(product.retailMarginValue).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-soft-teal">
                      {product.retailPrice
                        ? `Rp ${Number(product.retailPrice).toLocaleString("id-ID")}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-xs font-bold text-primary-maroon"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-text-muted">
                      Belum ada produk.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
