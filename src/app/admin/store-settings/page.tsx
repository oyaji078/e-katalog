import { requireAdmin } from "@/lib/access-control";
import { getDb } from "@/lib/db";
import { getOrCreateSiteSettings } from "@/lib/site-settings";
import SiteSettingsFormClient from "./SiteSettingsFormClient";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage() {
  await requireAdmin();
  const db = getDb();
  const settings = await getOrCreateSiteSettings(db);

  return (
    <main className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-brand-primary">
          Pengaturan Web
        </p>
        <h1 className="mt-1 text-2xl font-black text-brand-text">Identitas Website</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">
          Kelola nama, logo, warna, kontak, dan informasi footer yang tampil di halaman publik
          serta dashboard admin.
        </p>
      </div>

      <SiteSettingsFormClient settings={settings} />
    </main>
  );
}
