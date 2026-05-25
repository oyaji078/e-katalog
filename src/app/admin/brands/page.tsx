import Link from "next/link";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import BrandManagerClient from "./BrandManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const session = await getAdminSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
        <section className="mx-auto max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Unauthorized access</p>
          <Link href="/" className="mt-4 block text-center text-brand-primary">
            Go to Homepage
          </Link>
        </section>
      </main>
    );
  }

  const brands = await getDb().brand.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Brands</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Manage brands shown across product cards, filters, and detail pages.
          </p>
        </div>
        <BrandManagerClient brands={brands} />
      </div>
    </main>
  );
}
