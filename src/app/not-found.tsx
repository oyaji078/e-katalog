import Link from 'next/link';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/ui/PublicFooter';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { getDb } from '@/lib/db';
import { getFeatureFlags } from '@/lib/feature-flags';
import { getPublicSiteSettings } from '@/lib/site-settings';
import { getStoreWhatsappNumberFromDB } from '@/lib/store-settings';
import { buildWhatsappUrl } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export default async function NotFound() {
  const db = getDb();
  const [flags, waNumber, settings, categories] = await Promise.all([
    getFeatureFlags(['enable_public_voucher']),
    getStoreWhatsappNumberFromDB(),
    getPublicSiteSettings(),
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
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
        announcementText={settings.announcementEnabled ? settings.announcementText : ""}
        announcementSpeed={settings.announcementSpeed}
        announcementLink={settings.announcementEnabled ? settings.announcementLink : null}
      />

      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="text-7xl font-bold text-[var(--color-accent)] opacity-20 mb-4">
            404
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            Halaman tidak ditemukan
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">
            Produk atau halaman yang Anda cari tidak tersedia.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg font-semibold hover:bg-[var(--color-accent-hover)] transition"
            >
              Kembali ke Beranda
            </Link>
            <Link
              href="/products"
              className="px-4 py-2.5 border border-[var(--color-border-strong)] text-[var(--color-text)] rounded-lg font-semibold hover:bg-[var(--color-page)] transition"
            >
              Lihat Katalog
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter
        whatsappUrl={waUrl}
        storeName={settings.storeName}
        publicVoucherEnabled={flags.enable_public_voucher}
        topCategories={categories}
      />

      <MobileBottomNav publicVoucherEnabled={flags.enable_public_voucher} />
    </main>
  );
}
