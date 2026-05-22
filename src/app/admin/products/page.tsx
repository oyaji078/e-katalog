import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import ProductArchiveFormClient from "./ProductArchiveFormClient";

export const dynamic = "force-dynamic";

function formatRupiah(value: unknown) {
  const numberValue = Number(value ?? 0);
  return `Rp ${numberValue.toLocaleString("id-ID")}`;
}

export default async function AdminProductsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  // Check if user is admin or super admin
  if (!session?.user || !(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN")) {
    return (
      <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
        <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Unauthorized access</p>
          <Link href="/" className="block text-center mt-4">
            Go to Homepage
          </Link>
        </section>
      </main>
    );
  }

  const db = getDb();
  const products = await db.product.findMany({
    include: {
      category: true,
      brand: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      {/* Top Bar */}
      <div className="border-b border-border-gray bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-text-muted sm:px-6">
          <div className="flex items-center gap-2">
            <svg
              className="size-4 text-soft-teal"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Garansi toko dan dukungan WhatsApp</span>
          </div>
          <div className="hidden items-center gap-5 sm:flex">
            <span>Promo</span>
            <span>Voucher</span>
            <Link href="/login" className="font-semibold text-primary-maroon">
              Retail Login
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border-gray bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center">
          <Link href="/admin" className="text-xl font-bold text-primary-maroon">
            E-Katalog Komputer
          </Link>
          <div className="flex flex-1 items-center rounded-2xl border border-border-gray bg-white px-4 py-3 shadow-sm lg:mx-5">
            <svg
              className="mr-3 size-5 text-text-muted"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <input
              aria-label="Cari produk"
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Cari nama, SKU, atau merek..."
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Produk</h1>
          <p className="mt-2 text-sm text-text-muted">
            Kelola produk yang tersedia dalam e-katalog.
          </p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-maroon rounded-lg hover:bg-primary-maroon/80"
          >
            Tambah Produk Baru
          </Link>
        </div>

        {/* Products Table */}
        <div className="rounded-xl border border-border-gray bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-gray">
              <thead className="bg-primary-maroon/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">
                    Gambar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">
                    Merek
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">
                    Harga Publik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">
                    Harga Retail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-maroon uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/50">
                    <td className="px-6 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-primary-maroon/10 text-xs font-bold text-primary-maroon">
                        {product.name.slice(0, 2).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-dark">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted font-mono">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                      {product.category?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                      {product.brand?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted font-mono">
                      {formatRupiah(product.publicPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted font-mono">
                      {product.retailPrice ? (
                        <span className="text-success">{formatRupiah(product.retailPrice)}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          product.status === "ACTIVE"
                            ? "bg-success/20 text-success"
                            : product.status === "DRAFT"
                            ? "bg-warning/20 text-warning"
                            : "bg-muted/20 text-muted"
                        }`}
                      >
                        {product.status === "ACTIVE"
                          ? "Aktif"
                          : product.status === "DRAFT"
                          ? "Draft"
                          : "Arsip"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-xs font-medium text-primary-maroon hover:text-primary-maroon/80"
                      >
                        Edit
                      </Link>
                      <ProductArchiveFormClient productId={product.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
