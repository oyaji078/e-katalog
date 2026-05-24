"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

import { formatRupiah, voucherLabel } from "@/lib/catalog";
import { isRenderablePromoBannerImageUrl } from "@/lib/promo-banner-url";
import VoucherDisableFormClient from "../vouchers/VoucherDisableFormClient";

import type { Prisma } from "@/generated/prisma/client";

type VoucherWithRelations = Prisma.VoucherGetPayload<{
  include: { categories: true; products: true };
}>;

type PromoBannerRecord = Prisma.PromoBannerGetPayload<object>;

type Props = {
  vouchers: VoucherWithRelations[];
  banners: PromoBannerRecord[];
  currentTab: string;
};

const TABS = [
  { key: "vouchers", label: "Voucher" },
  { key: "banners", label: "Banner Promo" },
  { key: "products", label: "Produk Promo" },
  { key: "settings", label: "Pengaturan Tampilan" },
];

export default function PromoVouchersClient({ vouchers, banners, currentTab }: Props) {
  return (
    <main className="text-text-dark">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promo & Voucher</h1>
          <p className="mt-1 text-sm text-text-muted">
            Kelola voucher, banner promo, dan pengaturan tampilan promo.
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-border-gray">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/promo-vouchers?tab=${tab.key}`}
            className={`px-4 py-3 text-sm font-semibold transition ${
              currentTab === tab.key
                ? "border-b-2 border-primary-maroon text-primary-maroon"
                : "text-text-muted hover:text-text-dark"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {currentTab === "vouchers" ? <VoucherTab vouchers={vouchers} /> : null}
      {currentTab === "banners" ? <BannerTab banners={banners} /> : null}
      {currentTab === "products" ? (
        <PlaceholderTab
          title="Produk Promo"
          description="Coming soon — this will manage product-level promo assignments."
        />
      ) : null}
      {currentTab === "settings" ? (
        <PlaceholderTab
          title="Pengaturan Tampilan"
          description="Atur bagian promo mana yang tampil di halaman utama, urutan tampilan, dan pengaturan visibilitas lainnya."
        />
      ) : null}
    </main>
  );
}

function VoucherTab({ vouchers }: { vouchers: VoucherWithRelations[] }) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link
          href="/admin/vouchers/new"
          className="rounded-md bg-primary-maroon px-4 py-2 text-sm font-bold text-white"
        >
          Add Voucher
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border-gray bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-gray text-sm">
            <thead className="bg-primary-maroon/5 text-xs uppercase tracking-wide text-primary-maroon">
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
            <tbody className="divide-y divide-border-gray">
              {vouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-text-dark">{voucher.title}</p>
                    <p className="font-mono text-xs text-text-muted">{voucher.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                      voucher.audience === "RETAIL"
                        ? "bg-soft-teal/20 text-primary-maroon"
                        : "bg-accent-rose/10 text-accent-rose"
                    }`}>
                      {voucher.audience === "RETAIL" ? "Retail" : "Public"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-accent-rose">
                    {voucherLabel(voucher)}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {voucher.minimumPurchase ? formatRupiah(voucher.minimumPurchase) : "-"}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {voucher.scope}
                    {voucher.scope === "PRODUCTS" ? ` (${voucher.products.length})` : ""}
                    {voucher.scope === "CATEGORIES" ? ` (${voucher.categories.length})` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {dateLabel(voucher.startsAt)} - {dateLabel(voucher.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                      voucher.isActive && voucher.status === "ACTIVE"
                        ? "bg-success/20 text-success"
                        : "bg-text-muted/10 text-text-muted"
                    }`}>
                      {voucher.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/vouchers/${voucher.id}/edit`} className="text-xs font-bold text-primary-maroon">
                        Edit
                      </Link>
                      <VoucherDisableFormClient voucherId={voucher.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-text-muted">
                    No vouchers found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BannerTab({ banners }: { banners: PromoBannerRecord[] }) {
  const router = useRouter();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete(bannerId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/promo-banners/${bannerId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setConfirmingId(null);
      router.refresh();
    } catch {
      alert("Gagal menghapus banner");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link
          href="/admin/promo-banners/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-maroon px-5 py-2.5 text-sm font-bold text-white"
        >
          <Plus size={18} />
          Tambah Banner
        </Link>
      </div>

      <section className="rounded-lg border border-border-gray bg-white shadow-sm">
        <div className="divide-y divide-border-gray">
          {banners.map((banner) => {
            const imageSrc = banner.imageUrl && isRenderablePromoBannerImageUrl(banner.imageUrl)
              ? banner.imageUrl : null;

            return (
              <article key={banner.id} className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,2fr)_7rem_9rem_10rem_5rem_9rem] md:items-center md:gap-3">
                <div className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-3 md:grid-cols-[4.5rem_minmax(0,1fr)]">
                  <div className="relative h-16 overflow-hidden rounded-lg bg-soft-bg">
                    {imageSrc ? (
                      <Image src={imageSrc} alt={`Gambar ${banner.title}`} fill sizes="4.5rem" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-text-muted">
                        Teks saja
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-text-dark">{banner.title}</h2>
                    {banner.subtitle ? (
                      <p className="mt-1 line-clamp-2 text-xs text-text-muted">{banner.subtitle}</p>
                    ) : (
                      <p className="mt-1 text-xs text-text-muted">Tanpa subjudul</p>
                    )}
                  </div>
                </div>

                <div>
                  <span className="md:hidden text-xs font-bold text-text-muted">Status: </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    banner.isActive ? "bg-success/15 text-success" : "bg-border-gray/60 text-text-muted"
                  }`}>
                    {banner.isActive ? "Aktif" : "Tidak Aktif"}
                  </span>
                </div>

                <p className="text-sm text-text-dark">
                  <span className="md:hidden text-xs font-bold text-text-muted">Target Audiens: </span>
                  {audienceLabel(banner.audience)}
                </p>

                <p className="text-sm text-text-dark">
                  <span className="md:hidden text-xs font-bold text-text-muted">Jadwal: </span>
                  {scheduleLabel(banner.startsAt, banner.endsAt)}
                </p>

                <p className="text-sm text-text-dark">
                  <span className="md:hidden text-xs font-bold text-text-muted">Urutan: </span>
                  {banner.sortOrder}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/promo-banners/${banner.id}/edit`}
                    className="rounded-lg bg-soft-bg px-3 py-1.5 text-xs font-semibold text-primary-maroon"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setConfirmingId(banner.id)}
                    className="rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger"
                  >
                    Hapus
                  </button>
                </div>

                {confirmingId === banner.id ? (
                  <div className="col-span-full rounded-lg border border-danger/20 bg-danger/5 p-4">
                    <p className="text-sm text-text-dark">Hapus banner &quot;{banner.title}&quot;?</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleDelete(banner.id)} disabled={loading}
                        className="rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
                        {loading ? "..." : "Ya, Hapus"}
                      </button>
                      <button onClick={() => setConfirmingId(null)} disabled={loading}
                        className="rounded-lg border border-border-gray px-3 py-1.5 text-xs font-semibold text-text-muted">
                        Batal
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}

          {banners.length === 0 ? (
            <div className="p-10 text-center text-sm text-text-muted">
              Belum ada banner promo.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border-gray bg-white p-10 text-center shadow-sm">
      <h2 className="text-lg font-bold text-text-dark">{title}</h2>
      <p className="mt-3 text-sm text-text-muted">{description}</p>
    </div>
  );
}

function audienceLabel(audience: string) {
  if (audience === "AUTHENTICATED") return "User Login";
  if (audience === "RETAIL") return "Ritel Aktif";
  return "Semua Pengunjung";
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
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(date);
}
