import Link from "next/link";

import { formatRupiah } from "@/lib/catalog";
import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export default async function AdminPricesPage() {
  const session = await getAdminSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
        <section className="mx-auto max-w-md rounded-lg border border-border-gray bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Unauthorized access</p>
          <Link href="/" className="mt-4 block text-center text-primary-maroon">
            Go to Homepage
          </Link>
        </section>
      </main>
    );
  }

  const [products, marginEnabled] = await Promise.all([
    getDb().product.findMany({
      include: {
        brand: true,
        category: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
    isFeatureEnabled("enable_margin_management"),
  ]);

  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Prices and Margins</h1>
            <p className="mt-2 text-sm text-text-muted">
              Review cost, public margin, retail margin, and calculated catalog prices.
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="rounded-md bg-primary-maroon px-4 py-2 text-sm font-bold text-white"
          >
            Add Product
          </Link>
        </div>

        {!marginEnabled ? (
          <div className="mb-4 rounded-lg border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
            Margin management is currently disabled. Price and margin changes are blocked.
            Product prices can still be viewed.
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-border-gray bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-gray text-sm">
              <thead className="bg-primary-maroon/5 text-xs uppercase tracking-wide text-primary-maroon">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Cost</th>
                  <th className="px-4 py-3 text-left">Public Margin</th>
                  <th className="px-4 py-3 text-left">Public Price</th>
                  <th className="px-4 py-3 text-left">Retail Margin</th>
                  <th className="px-4 py-3 text-left">Retail Price</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-dark">{product.name}</p>
                      <p className="text-xs text-text-muted">
                        {product.category.name} / {product.brand.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{product.sku}</td>
                    <td className="px-4 py-3 font-mono text-danger">
                      {formatRupiah(product.costPrice)}
                    </td>
                    <td className="px-4 py-3">
                      {marginLabel(product.publicMarginType, product.publicMarginValue)}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-accent-rose">
                      {formatRupiah(product.publicPrice)}
                    </td>
                    <td className="px-4 py-3">
                      {marginLabel(product.retailMarginType, product.retailMarginValue)}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-soft-teal">
                      {product.retailPrice ? formatRupiah(product.retailPrice) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {marginEnabled ? (
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="text-xs font-bold text-primary-maroon"
                        >
                          Edit pricing
                        </Link>
                      ) : (
                        <span className="text-xs text-text-muted">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-text-muted">
                      No products found.
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

function marginLabel(type: string, value: unknown) {
  const numericValue = Number(value ?? 0);
  if (type === "PERCENTAGE") return `${numericValue}%`;
  return formatRupiah(numericValue);
}
