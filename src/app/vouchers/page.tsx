import { BadgePercent, CheckCircle, Clock, TicketPercent } from "lucide-react";
import { redirect } from "next/navigation";

import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/ui/PublicFooter";
import VoucherBanner from "@/components/ui/VoucherBanner";
import VoucherCard from "@/components/ui/VoucherCard";
import { canUseRetailVoucher, formatRupiah, voucherLabel } from "@/lib/catalog";
import { getActiveCategories } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getCurrentUser } from "@/lib/session";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { getStoreWhatsappNumberFromDB } from "@/lib/store-settings";
import { buildWhatsappUrl } from "@/lib/whatsapp";

export default async function VouchersPage() {
  const db = getDb();
  const [user, publicVoucherEnabled, retailVoucherEnabled, settings, waNumber, allCategories] =
    await Promise.all([
      getCurrentUser().catch(() => null),
      isFeatureEnabled("enable_public_voucher"),
      isFeatureEnabled("enable_retail_voucher"),
      getPublicSiteSettings(),
      getStoreWhatsappNumberFromDB(),
      getActiveCategories(),
    ]);
  const topCategories = allCategories.slice(0, 8);

  if (user?.role === "ADMIN") redirect("/admin");
  if (user?.role === "SUPER_ADMIN") redirect("/super-admin");

  const canSeeRetailVouchers = canUseRetailVoucher(user);
  const now = new Date();
  const generalWaUrl = buildWhatsappUrl({
    message: "Halo Admin, saya ingin bertanya tentang voucher yang tersedia di katalog.",
    whatsappNumber: waNumber,
  });

  const vouchers = await db.voucher.findMany({
    where: {
      isActive: true,
      status: { in: ["ACTIVE", "EXPIRED"] },
    },
    orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
  });

  const displayVouchers = vouchers.filter((voucher) => {
    const isGuestOrPublic = !canSeeRetailVouchers;
    if (isGuestOrPublic) return voucher.showForPublic && publicVoucherEnabled;
    return voucher.showForRetail && retailVoucherEnabled;
  });

  const claimedIds = user
    ? new Set(
        (
          await db.voucherClaim.findMany({
            where: { userId: user.id, status: "CLAIMED" },
            select: { voucherId: true },
          })
        ).map((claim) => claim.voucherId),
      )
    : new Set<string>();

  const liveVouchers = displayVouchers.filter(
    (voucher) =>
      voucher.status === "ACTIVE" &&
      voucher.isActive &&
      voucher.startsAt <= now &&
      voucher.endsAt >= now,
  );
  const highlightedVoucher = liveVouchers[0];
  const claimedCount = displayVouchers.filter((voucher) => claimedIds.has(voucher.id)).length;
  const expiredCount = displayVouchers.filter((voucher) => voucher.endsAt < now).length;

  return (
    <main className="min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
      <PublicNavbar
        whatsappUrl={generalWaUrl}
        session={user}
        announcementText={settings.announcementEnabled ? settings.announcementText : ""}
        announcementSpeed={settings.announcementSpeed}
        announcementLink={settings.announcementEnabled ? settings.announcementLink : null}
        topCategories={topCategories}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="rounded-2xl bg-[var(--color-brand)] p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                <TicketPercent className="size-4" />
                Voucher katalog
              </p>
              <h1 className="mt-2 text-3xl font-bold leading-tight">Voucher Promo WhatsApp</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                Klaim voucher yang tersedia, lalu voucher akan ikut masuk ke inquiry WhatsApp untuk
                diverifikasi admin.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Aktif" value={liveVouchers.length} icon="active" />
              <Metric label="Diklaim" value={claimedCount} icon="claimed" />
              <Metric label="Expired" value={expiredCount} icon="expired" />
            </div>
          </div>
        </section>

        {highlightedVoucher ? (
          <div className="mt-6">
            <VoucherBanner
              voucherId={highlightedVoucher.id}
              code={claimedIds.has(highlightedVoucher.id) ? highlightedVoucher.code : undefined}
              title={highlightedVoucher.title}
              subtitle={highlightedVoucher.description ?? undefined}
              discountLabel={voucherLabel(highlightedVoucher)}
              audience={highlightedVoucher.showForRetail && !highlightedVoucher.showForPublic ? "RETAIL" : "PUBLIC"}
              expiresAt={highlightedVoucher.endsAt.toISOString()}
              minimumPurchase={
                highlightedVoucher.minimumPurchase
                  ? formatRupiah(highlightedVoucher.minimumPurchase)
                  : undefined
              }
              isAuthenticated={!!user}
              isClaimed={claimedIds.has(highlightedVoucher.id)}
              canClaim
              ctaLabel="Klaim Sekarang"
            />
          </div>
        ) : null}

        <section id="voucher-list" className="mt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                Daftar voucher
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--color-text)]">Pilih Promo Katalog</h2>
            </div>
            {!canSeeRetailVouchers && retailVoucherEnabled ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] shadow-sm">
                Voucher ritel bisa diklaim setelah akun ritel aktif.
              </div>
            ) : null}
          </div>

          {displayVouchers.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {displayVouchers.map((voucher) => {
                const isLive =
                  voucher.status === "ACTIVE" &&
                  voucher.isActive &&
                  voucher.startsAt <= now &&
                  voucher.endsAt >= now;
                const isExpired = voucher.endsAt < now || voucher.status === "EXPIRED";
                const disabledReason = isExpired
                  ? "Voucher sudah expired."
                  : !isLive
                    ? "Voucher belum aktif."
                    : undefined;

                return (
                  <VoucherCard
                    key={voucher.id}
                    id={voucher.id}
                    code={voucher.code}
                    title={voucher.title}
                    description={voucher.description ?? undefined}
                    discountLabel={voucherLabel(voucher)}
                    minimumPurchase={
                      voucher.minimumPurchase ? formatRupiah(voucher.minimumPurchase) : undefined
                    }
                    audience={voucher.showForRetail && !voucher.showForPublic ? "RETAIL" : "PUBLIC"}
                    expiresAt={voucher.endsAt.toISOString()}
                    isActive={isLive}
                    isExpired={isExpired}
                    isAuthenticated={!!user}
                    isClaimed={claimedIds.has(voucher.id)}
                    canClaim={isLive}
                    disabledReason={disabledReason}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-10 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Voucher belum tersedia</h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Feature flag voucher mungkin nonaktif atau admin belum menerbitkan voucher.
              </p>
            </div>
          )}
        </section>
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

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: "active" | "claimed" | "expired";
}) {
  const Icon = icon === "active" ? BadgePercent : icon === "claimed" ? CheckCircle : Clock;

  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/20">
      <Icon className="mx-auto size-5 text-white/80" />
      <p className="mt-1 text-xl font-bold">{value}</p>
      <p className="text-[11px] font-semibold text-white/70">{label}</p>
    </div>
  );
}
