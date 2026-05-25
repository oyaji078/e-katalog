import Link from "next/link";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import VoucherFormClient from "../VoucherFormClient";

export const dynamic = "force-dynamic";

export default async function NewVoucherPage() {
  const session = await getAdminSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
        <section className="mx-auto max-w-md rounded-lg border border-brand-border bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Unauthorized access</p>
          <Link href="/" className="mt-4 block text-center text-brand-primary">
            Go to Homepage
          </Link>
        </section>
      </main>
    );
  }

  const db = getDb();
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link href="/admin/promo-vouchers" className="text-sm font-bold text-brand-primary">
            Back to vouchers
          </Link>
          <h1 className="mt-3 text-2xl font-bold">Create Voucher</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Vouchers inform catalog visitors before WhatsApp inquiry. They do not create checkout.
          </p>
        </div>
        <VoucherFormClient
          mode="create"
          products={products.map((product) => ({
            id: product.id,
            label: `${product.name} (${product.sku})`,
          }))}
          categories={categories.map((category) => ({ id: category.id, label: category.name }))}
        />
      </div>
    </main>
  );
}
