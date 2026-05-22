import Link from "next/link";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import CategoryManagerClient from "./CategoryManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await getAdminSession();

  if (!session) {
    return (
      <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
        <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Unauthorized access</p>
          <Link href="/" className="mt-4 block text-center text-primary-maroon">
            Go to Homepage
          </Link>
        </section>
      </main>
    );
  }

  const categories = await getDb().category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="mt-2 text-sm text-text-muted">
            Manage catalog categories used by product browsing and vouchers.
          </p>
        </div>
        <CategoryManagerClient categories={categories} />
      </div>
    </main>
  );
}
