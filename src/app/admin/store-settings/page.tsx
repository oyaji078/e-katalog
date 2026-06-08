import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";
import { getOrCreateSiteSettings } from "@/lib/site-settings";
import SiteSettingsFormClient from "./SiteSettingsFormClient";
import StoreSettingsClient from "./StoreSettingsClient";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage() {
  await requireAdmin();
  const db = getDb();
  const [settings, storeSettings] = await Promise.all([
    getOrCreateSiteSettings(db),
    db.storeSetting.findMany({
      orderBy: { key: "asc" },
      select: {
        id: true,
        key: true,
        value: true,
        isSecret: true,
        description: true,
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-brand-accent">
          Pengaturan Web
        </p>
        <h1 className="mt-1 text-2xl font-black text-brand-text">Identitas dan Tema Website</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">
          Kelola nama, logo, warna 60/30/10, tulisan berjalan, kontak, dan informasi footer
          yang tampil di halaman publik serta dashboard admin.
        </p>
      </div>

      <SiteSettingsFormClient settings={settings} />

      <section className="mt-10">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-wide text-brand-accent">
            Key Value Store
          </p>
          <h2 className="mt-1 text-xl font-black text-brand-text">Pengaturan Teknis Toko</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">
            Edit pengaturan lama berbasis key/value tanpa menghapus form identitas dan tema website.
          </p>
        </div>
        <StoreSettingsClient settings={storeSettings} />
      </section>
    </main>
  );
}
