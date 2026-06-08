import Image from "next/image";
import Link from "next/link";

import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/ui/PublicFooter";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getCurrentUser } from "@/lib/session";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { getStoreWhatsappNumberFromDB } from "@/lib/store-settings";
import { buildWhatsappUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function CategoriesIndexPage() {
  const db = getDb();

  const [user, publicVoucherEnabled, settings, waNumber, categories, productCounts] =
    await Promise.all([
      getCurrentUser().catch(() => null),
      isFeatureEnabled("enable_public_voucher"),
      getPublicSiteSettings(),
      getStoreWhatsappNumberFromDB(),
      db.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true, description: true, logoUrl: true, iconUrl: true },
      }),
      // Count only publicly-visible products (ACTIVE + active brand), matching
      // what /categories/[slug] renders. groupBy avoids filtered-_count portability.
      db.product.groupBy({
        by: ["categoryId"],
        where: { status: "ACTIVE", brand: { isActive: true } },
        _count: { _all: true },
      }),
    ]);

  const countByCategory = new Map(productCounts.map((row) => [row.categoryId, row._count._all]));

  const generalWaUrl = buildWhatsappUrl({
    message: "Halo Admin, saya ingin bertanya tentang kategori produk.",
    whatsappNumber: waNumber,
  });

  const topCategories = categories.slice(0, 8).map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--color-page)] text-[var(--color-text)]">
      <PublicNavbar
        whatsappUrl={generalWaUrl}
        session={user}
        announcementText={settings.announcementEnabled ? settings.announcementText : ""}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
            Katalog
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-[var(--color-text)]">
            Semua Kategori
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            Jelajahi produk berdasarkan kategori.
          </p>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {categories.map((category) => {
              const count = countByCategory.get(category.id) ?? 0;
              const image = category.logoUrl || category.iconUrl;
              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {image ? (
                      <Image
                        src={image}
                        alt={category.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-page)] text-lg font-bold text-[var(--color-accent)]">
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-[var(--color-text)] transition group-hover:text-[var(--color-accent)]">
                        {category.name}
                      </h2>
                      <p className="text-xs text-[var(--color-text-muted)]">{count} produk</p>
                    </div>
                  </div>
                  {category.description ? (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--color-text-muted)]">
                      {category.description}
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-text-muted)]">
            Belum ada kategori aktif.
          </div>
        )}
      </div>

      <PublicFooter
        whatsappUrl={generalWaUrl}
        storeName={settings.storeName}
        storeAddress={settings.address}
        publicVoucherEnabled={publicVoucherEnabled}
        topCategories={topCategories}
      />
    </main>
  );
}
