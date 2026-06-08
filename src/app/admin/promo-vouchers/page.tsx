import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";

import { getAdminSession } from "@/lib/admin-auth";
import { serializeBannerVoucher, type SerializedBannerVoucher } from "@/lib/banner-voucher";
import { formatRupiah, voucherLabel } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { isRenderablePromoBannerImageUrl } from "@/lib/promo-banner-url";
import VoucherActionsClient from "./VoucherActionsClient";
import BannerActionsClient from "./BannerActionsClient";

type VoucherWithRelations = Prisma.VoucherGetPayload<{
  include: { categories: true; products: true };
}>;

export const dynamic = "force-dynamic";

const TABS = [
  { key: "vouchers", label: "Voucher" },
  { key: "banners", label: "Banner Promo" },
];

type BannerRow = Prisma.PromoBannerGetPayload<object> & {
  linkedVoucher: SerializedBannerVoucher | null;
};

export default async function PromoVouchersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getAdminSession();
  const tab = (await searchParams).tab || "vouchers";

  if (!session) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10 text-brand-text">
        <section className="mx-auto max-w-md rounded-lg border border-brand-border bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Unauthorized access</p>
          <Link href="/" className="mt-4 block text-center text-brand-primary">Go to Homepage</Link>
        </section>
      </main>
    );
  }

  const db = getDb();

  const [vouchers, banners] = await Promise.all([
    db.voucher.findMany({
      include: { categories: true, products: true },
      orderBy: [{ createdAt: "desc" }],
    }),
    db.promoBanner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);
  const bannerVoucherIds = Array.from(
    new Set(banners.map((banner) => banner.voucherId).filter(Boolean)),
  ) as string[];
  const linkedVouchers = bannerVoucherIds.length
    ? await db.voucher.findMany({ where: { id: { in: bannerVoucherIds } } })
    : [];
  const linkedVoucherMap = new Map(
    linkedVouchers.map((voucher) => [voucher.id, serializeBannerVoucher(voucher)]),
  );
  const bannerRows: BannerRow[] = banners.map((banner) => ({
    ...banner,
    linkedVoucher: banner.voucherId ? linkedVoucherMap.get(banner.voucherId) ?? null : null,
  }));
  const activeTab = tab === "banners" ? "banners" : "vouchers";

  return (
    <main className="text-brand-text">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promo & Voucher</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Kelola voucher, banner promo, dan pengaturan tampilan promo.
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-brand-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/promo-vouchers?tab=${t.key}`}
            className={`px-4 py-3 text-sm font-semibold transition ${
              activeTab === t.key
                ? "border-b-2 border-brand-primary text-brand-primary"
                : "text-brand-muted hover:text-brand-text"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "vouchers" ? <VoucherTab vouchers={vouchers} /> : null}
      {activeTab === "banners" ? <BannerTab banners={bannerRows} /> : null}
    </main>
  );
}

function VoucherTab({ vouchers }: { vouchers: VoucherWithRelations[] }) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href="/admin/vouchers/new" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-bold text-white">
          Add Voucher
        </Link>
      </div>

      {vouchers.length === 0 ? (
        <div className="rounded-lg border border-brand-border bg-white p-10 text-center text-sm text-brand-muted">
          No vouchers found.
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="grid gap-3 md:hidden">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="min-w-0 rounded-lg border border-brand-border bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-brand-text">{voucher.title}</p>
                    <p className="font-mono text-xs text-brand-muted">{voucher.code}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${voucher.isActive && voucher.status === "ACTIVE" ? "bg-success/20 text-success" : "bg-brand-muted/10 text-brand-muted"}`}>
                    {voucher.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <span className="font-semibold text-brand-muted">Diskon:</span>
                  <span className="font-semibold text-brand-accent">{voucherLabel(voucher)}</span>
                  <span className="font-semibold text-brand-muted">Min. Pembelian:</span>
                  <span>{voucher.minimumPurchase ? formatRupiah(voucher.minimumPurchase) : "-"}</span>
                  <span className="font-semibold text-brand-muted">Audiens:</span>
                  <span className="inline-flex gap-1">
                    {voucher.showForPublic ? <span className="rounded-full bg-brand-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-accent">Public</span> : null}
                    {voucher.showForRetail ? <span className="rounded-full bg-brand-secondary/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-primary">Retail</span> : null}
                  </span>
                  <span className="font-semibold text-brand-muted">Cakupan:</span>
                  <span>
                    {voucher.scope}
                    {voucher.scope === "PRODUCTS" ? ` (${voucher.products.length})` : ""}
                    {voucher.scope === "CATEGORIES" ? ` (${voucher.categories.length})` : ""}
                  </span>
                  <span className="font-semibold text-brand-muted">Periode:</span>
                  <span className="text-[11px]">{dateLabel(voucher.startsAt)} - {dateLabel(voucher.endsAt)}</span>
                </div>
                <div className="mt-3 flex justify-end">
                  <VoucherActionsClient voucherId={voucher.id} isActive={voucher.isActive && voucher.status === "ACTIVE"} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden overflow-hidden rounded-lg border border-brand-border bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border text-sm">
                <thead className="bg-[#EEF4F7] text-xs uppercase tracking-wide text-[#111827]">
                  <tr>
                    <th className="px-4 py-3 text-left">Voucher</th>
                    <th className="px-4 py-3 text-left">Audience</th>
                    <th className="px-4 py-3 text-left">Discount</th>
                    <th className="px-4 py-3 text-left">Minimum</th>
                    <th className="px-4 py-3 text-left">Scope</th>
                    <th className="px-4 py-3 text-left">Window</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {vouchers.map((voucher) => (
                    <tr key={voucher.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-brand-text">{voucher.title}</p>
                        <p className="font-mono text-xs text-brand-muted">{voucher.code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex gap-1">
                          {voucher.showForPublic ? <span className="rounded-full bg-brand-accent/10 px-2 py-1 text-xs font-bold text-brand-accent">Public</span> : null}
                          {voucher.showForRetail ? <span className="rounded-full bg-brand-secondary/20 px-2 py-1 text-xs font-bold text-brand-primary">Retail</span> : null}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand-accent">{voucherLabel(voucher)}</td>
                      <td className="px-4 py-3 text-brand-muted">
                        {voucher.minimumPurchase ? formatRupiah(voucher.minimumPurchase) : "-"}
                      </td>
                      <td className="px-4 py-3 text-brand-muted">
                        {voucher.scope}
                        {voucher.scope === "PRODUCTS" ? ` (${voucher.products.length})` : ""}
                        {voucher.scope === "CATEGORIES" ? ` (${voucher.categories.length})` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-muted">
                        {dateLabel(voucher.startsAt)} - {dateLabel(voucher.endsAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${voucher.isActive && voucher.status === "ACTIVE" ? "bg-success/20 text-success" : "bg-brand-muted/10 text-brand-muted"}`}>
                          {voucher.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <VoucherActionsClient voucherId={voucher.id} isActive={voucher.isActive && voucher.status === "ACTIVE"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BannerTab({ banners }: { banners: BannerRow[] }) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href="/admin/promo-banners/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-bold text-white">
          <Plus size={18} />
          Tambah Banner
        </Link>
      </div>

      <section className="rounded-lg border border-brand-border bg-white shadow-sm">
        <div className="divide-y divide-brand-border">
          {banners.map((banner) => {
            const imageSrc = banner.imageUrl && isRenderablePromoBannerImageUrl(banner.imageUrl) ? banner.imageUrl : null;
            const linkedVoucherMissing = banner.linkType === "VOUCHER" && !banner.linkedVoucher;
            const linkedVoucherInvalid = banner.linkedVoucher && !banner.linkedVoucher.isLive;
            return (
              <article key={banner.id} className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,2fr)_7rem_9rem_10rem_5rem_9rem] md:items-center md:gap-3">
                <div className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-3 md:grid-cols-[4.5rem_minmax(0,1fr)]">
                  <div className="relative h-16 overflow-hidden rounded-lg bg-brand-bg">
                    {imageSrc ? (
                      <Image src={imageSrc} alt={`Gambar ${banner.title}`} fill sizes="4.5rem" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-brand-muted">
                        Teks saja
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-brand-text">{banner.title}</h2>
                    {banner.subtitle ? <p className="mt-1 line-clamp-2 text-xs text-brand-muted">{banner.subtitle}</p> : <p className="mt-1 text-xs text-brand-muted">Tanpa subjudul</p>}
                    {banner.linkedVoucher ? (
                      <div className="mt-2 grid gap-1 text-[11px] text-brand-muted">
                        <span className="font-bold text-brand-primary">
                          Voucher: {banner.linkedVoucher.code}
                        </span>
                        <span>
                          {banner.linkedVoucher.discountLabel} | Min {banner.linkedVoucher.minimumLabel} | {banner.linkedVoucher.audienceLabel}
                        </span>
                        <span>{banner.linkedVoucher.scheduleLabel}</span>
                      </div>
                    ) : null}
                    {linkedVoucherMissing ? (
                      <p className="mt-2 text-[11px] font-semibold text-warning">
                        Voucher tertaut hilang. Banner tidak tampil publik.
                      </p>
                    ) : null}
                    {linkedVoucherInvalid ? (
                      <p className="mt-2 text-[11px] font-semibold text-warning">
                        Voucher tertaut tidak aktif/valid. Banner tidak tampil publik.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <span className="md:hidden text-xs font-bold text-brand-muted">Status: </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${banner.isActive ? "bg-success/15 text-success" : "bg-brand-border/60 text-brand-muted"}`}>
                    {banner.isActive ? "Aktif" : "Tidak Aktif"}
                  </span>
                </div>

                <p className="text-sm text-brand-text">
                  <span className="md:hidden text-xs font-bold text-brand-muted">Target Audiens: </span>
                  {banner.showForPublic ? "Public" : null}
                  {banner.showForPublic && banner.showForRetail ? " & " : null}
                  {banner.showForRetail ? "Retail" : null}
                  {!banner.showForPublic && !banner.showForRetail ? "-" : null}
                </p>
                <p className="text-sm text-brand-text">
                  <span className="md:hidden text-xs font-bold text-brand-muted">Jadwal: </span>
                  {scheduleLabel(banner.startsAt, banner.endsAt)}
                </p>
                <p className="text-sm text-brand-text">
                  <span className="md:hidden text-xs font-bold text-brand-muted">Urutan: </span>
                  {banner.sortOrder}
                </p>

                <div className="flex flex-wrap gap-2">
                  <BannerActionsClient id={banner.id} isActive={banner.isActive} />
                </div>
              </article>
            );
          })}
          {banners.length === 0 ? (
            <div className="p-10 text-center text-sm text-brand-muted">Belum ada banner promo.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function scheduleLabel(startsAt: Date | null, endsAt: Date | null) {
  const start = dateLabel(startsAt);
  const end = dateLabel(endsAt);
  if (start && end) return `${start} - ${end}`;
  if (start) return `Mulai ${start}`;
  if (end) return `Sampai ${end}`;
  return "Tanpa jadwal";
}

function dateLabel(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
