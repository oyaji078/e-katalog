import Image from "next/image";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";

import { getAdminSession } from "@/lib/admin-auth";
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
  { key: "products", label: "Produk Promo" },
  { key: "settings", label: "Pengaturan Tampilan" },
];

export default async function PromoVouchersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getAdminSession();
  const tab = (await searchParams).tab || "vouchers";

  if (!session) {
    return (
      <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
        <section className="mx-auto max-w-md rounded-lg border border-border-gray bg-white p-6 shadow-sm">
          <p className="text-center text-danger">Unauthorized access</p>
          <Link href="/" className="mt-4 block text-center text-primary-maroon">Go to Homepage</Link>
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
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/promo-vouchers?tab=${t.key}`}
            className={`px-4 py-3 text-sm font-semibold transition ${
              tab === t.key
                ? "border-b-2 border-primary-maroon text-primary-maroon"
                : "text-text-muted hover:text-text-dark"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "vouchers" ? <VoucherTab vouchers={vouchers} /> : null}
      {tab === "banners" ? <BannerTab banners={banners} /> : null}
      {tab === "products" ? (
        <PromoProductsTab db={db} />
      ) : null}
      {tab === "settings" ? (
        <div className="rounded-lg border border-border-gray bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-bold text-text-dark">Pengaturan Tampilan</h2>
          <p className="mt-3 text-sm text-text-muted">
            Atur bagian promo mana yang tampil di halaman utama, urutan tampilan, dan pengaturan visibilitas lainnya.
          </p>
          <div className="mx-auto mt-6 max-w-md space-y-4 text-left">
            <div className="rounded-lg border border-border-gray bg-soft-bg p-4">
              <h3 className="text-sm font-bold text-text-dark">Bagian yang akan diatur</h3>
              <ul className="mt-2 space-y-2 text-sm text-text-muted">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary-maroon" />
                  Flash Sale strip
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary-maroon" />
                  Banner Promo
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary-maroon" />
                  Voucher
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary-maroon" />
                  Produk Rekomendasi
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary-maroon" />
                  Produk Baru
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary-maroon" />
                  Produk Populer
                </li>
              </ul>
            </div>
            <p className="text-xs text-text-muted">
              Fitur ini belum tersedia. Setiap bagian akan dapat diaktifkan/nonaktifkan secara independen dari halaman ini.
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function VoucherTab({ vouchers }: { vouchers: VoucherWithRelations[] }) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href="/admin/vouchers/new" className="rounded-md bg-primary-maroon px-4 py-2 text-sm font-bold text-white">
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
                    <span className="inline-flex gap-1">
                      {voucher.showForPublic ? <span className="rounded-full bg-accent-rose/10 px-2 py-1 text-xs font-bold text-accent-rose">Public</span> : null}
                      {voucher.showForRetail ? <span className="rounded-full bg-soft-teal/20 px-2 py-1 text-xs font-bold text-primary-maroon">Retail</span> : null}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-accent-rose">{voucherLabel(voucher)}</td>
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
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${voucher.isActive && voucher.status === "ACTIVE" ? "bg-success/20 text-success" : "bg-text-muted/10 text-text-muted"}`}>
                      {voucher.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <VoucherActionsClient voucherId={voucher.id} isActive={voucher.isActive && voucher.status === "ACTIVE"} />
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-text-muted">No vouchers found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BannerTab({ banners }: { banners: Prisma.PromoBannerGetPayload<object>[] }) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href="/admin/promo-banners/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-maroon px-5 py-2.5 text-sm font-bold text-white">
          <Plus size={18} />
          Tambah Banner
        </Link>
      </div>

      <section className="rounded-lg border border-border-gray bg-white shadow-sm">
        <div className="divide-y divide-border-gray">
          {banners.map((banner) => {
            const imageSrc = banner.imageUrl && isRenderablePromoBannerImageUrl(banner.imageUrl) ? banner.imageUrl : null;
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
                    {banner.subtitle ? <p className="mt-1 line-clamp-2 text-xs text-text-muted">{banner.subtitle}</p> : <p className="mt-1 text-xs text-text-muted">Tanpa subjudul</p>}
                  </div>
                </div>

                <div>
                  <span className="md:hidden text-xs font-bold text-text-muted">Status: </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${banner.isActive ? "bg-success/15 text-success" : "bg-border-gray/60 text-text-muted"}`}>
                    {banner.isActive ? "Aktif" : "Tidak Aktif"}
                  </span>
                </div>

                <p className="text-sm text-text-dark">
                  <span className="md:hidden text-xs font-bold text-text-muted">Target Audiens: </span>
                  {banner.showForPublic ? "Public" : null}
                  {banner.showForPublic && banner.showForRetail ? " & " : null}
                  {banner.showForRetail ? "Retail" : null}
                  {!banner.showForPublic && !banner.showForRetail ? "-" : null}
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
                  <BannerActionsClient id={banner.id} isActive={banner.isActive} />
                </div>
              </article>
            );
          })}
          {banners.length === 0 ? (
            <div className="p-10 text-center text-sm text-text-muted">Belum ada banner promo.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

async function PromoProductsTab({
  db,
}: {
  db: ReturnType<typeof getDb>;
}) {
  const [flashSaleProductIds, voucherProductIds] = await Promise.all([
    db.flashSaleProduct.findMany({
      where: { flashSale: { isActive: true, endsAt: { gte: new Date() } } },
      select: { productId: true },
    }),
    db.productVoucher.findMany({
      where: { voucher: { isActive: true, status: "ACTIVE" } },
      select: { productId: true },
    }),
  ]);
  const flashSaleIds = new Set(flashSaleProductIds.map((fsp) => fsp.productId));
  const voucherIds = new Set(voucherProductIds.map((vp) => vp.productId));
  const promoProductIds = Array.from(new Set([...flashSaleIds, ...voucherIds]));

  const promoProducts = promoProductIds.length > 0
    ? await db.product.findMany({
        where: { id: { in: promoProductIds } },
        select: {
          id: true,
          name: true,
          publicPrice: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      })
    : [];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href="/admin/products/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-maroon px-5 py-2.5 text-sm font-bold text-white">
          <Plus size={18} />
          Tambah Produk
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border-gray bg-white shadow-sm">
        {promoProducts.length === 0 ? (
          <div className="p-10 text-center text-sm text-text-muted">
            Belum ada produk promo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-gray text-sm">
              <thead className="bg-primary-maroon/5 text-xs uppercase tracking-wide text-primary-maroon">
                <tr>
                  <th className="px-4 py-3 text-left">Nama Produk</th>
                  <th className="px-4 py-3 text-left">Harga</th>
                  <th className="px-4 py-3 text-left">Status Promo</th>
                  <th className="px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {promoProducts.map((p) => {
                  const hasFlashSale = flashSaleIds.has(p.id);
                  const hasVoucher = voucherIds.has(p.id);
                  return (
                    <tr key={p.id} className="hover:bg-white/50">
                      <td className="max-w-xs truncate px-4 py-3 font-medium text-text-dark">
                        {p.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-accent-rose">
                        {formatRupiah(p.publicPrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted">
                        <div className="flex flex-wrap gap-1">
                          {hasFlashSale ? (
                            <span className="rounded-full bg-accent-rose/15 px-2 py-0.5 text-[10px] font-semibold text-accent-rose">
                              Flash Sale
                            </span>
                          ) : null}
                          {hasVoucher ? (
                            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                              Voucher
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-lg bg-soft-bg px-3 py-1.5 text-xs font-semibold text-primary-maroon"
                        >
                          <Eye size={14} />
                          Lihat
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
