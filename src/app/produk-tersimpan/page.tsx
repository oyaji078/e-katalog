import { redirect } from "next/navigation";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/ui/PublicFooter";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import SavedProductsClient from "./SavedProductsClient";
import { getCurrentUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { getStoreWhatsappNumberFromDB } from "@/lib/store-settings";
import { buildWhatsappUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function SavedProductsPage() {
  const user = await getCurrentUser().catch(() => null);

  if (user?.role === "ADMIN") redirect("/admin");
  if (user?.role === "SUPER_ADMIN") redirect("/super-admin");

  const db = getDb();
  const [flags, waNumber, settings, categories] = await Promise.all([
    getFeatureFlags(["enable_public_voucher"]),
    getStoreWhatsappNumberFromDB(),
    getPublicSiteSettings(),
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
      take: 8,
    }),
  ]);

  const waUrl = buildWhatsappUrl({
    message: 'Tanya produk dari katalog',
    whatsappNumber: waNumber,
  });

  return (
    <main className="min-h-screen bg-[var(--color-page)] flex flex-col">
      <PublicNavbar
        whatsappUrl={waUrl}
        session={user}
        announcementText={settings.announcementEnabled ? settings.announcementText : ""}
        announcementSpeed={settings.announcementSpeed}
        announcementLink={settings.announcementEnabled ? settings.announcementLink : null}
      />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Produk Tersimpan</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Produk yang Anda simpan akan ditampilkan di sini.
          </p>
        </div>

        <SavedProductsClient />
      </div>

      <PublicFooter
        whatsappUrl={waUrl}
        storeName={settings.storeName}
        publicVoucherEnabled={flags.enable_public_voucher}
        topCategories={categories}
      />

      <MobileBottomNav
        publicVoucherEnabled={flags.enable_public_voucher}
        isLoggedIn={!!user}
      />
    </main>
  );
}
