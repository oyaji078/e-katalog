import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import VoucherFormClient, { type VoucherFormValue } from "../../VoucherFormClient";

export const dynamic = "force-dynamic";

type EditVoucherPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditVoucherPage({ params }: EditVoucherPageProps) {
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

  const { id } = await params;
  const db = getDb();
  const [voucher, products, categories] = await Promise.all([
    db.voucher.findUnique({
      where: { id },
      include: {
        categories: { select: { id: true } },
        products: { select: { productId: true } },
      },
    }),
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

  if (!voucher) notFound();

  const value: VoucherFormValue = {
    id: voucher.id,
    code: voucher.code,
    title: voucher.title,
    description: voucher.description ?? "",
    audience: voucher.audience,
    status: voucher.status,
    discountType: voucher.discountType,
    discountValue: String(voucher.discountValue),
    minimumPurchase: voucher.minimumPurchase ? String(voucher.minimumPurchase) : "",
    startsAt: dateInputValue(voucher.startsAt),
    endsAt: dateInputValue(voucher.endsAt),
    isActive: voucher.isActive,
    usageQuota: String(voucher.usageQuota),
    scope: voucher.scope,
    productIds: voucher.products.map((item) => item.productId),
    categoryIds: voucher.categories.map((category) => category.id),
  };

  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link href="/admin/vouchers" className="text-sm font-bold text-primary-maroon">
            Back to vouchers
          </Link>
          <h1 className="mt-3 text-2xl font-bold">Edit Voucher</h1>
          <p className="mt-2 text-sm text-text-muted">
            Update voucher visibility, scope, discount, and active window.
          </p>
        </div>
        <VoucherFormClient
          mode="edit"
          voucher={value}
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

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 16);
}
