import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { requireAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { isRenderablePromoBannerImageUrl } from "@/lib/promo-banner-url";
import DeleteHeroBannerButton from "./DeleteHeroBannerButton";

export const dynamic = "force-dynamic";

function dateLabel(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function scheduleLabel(startsAt: Date | null, endsAt: Date | null) {
  const start = dateLabel(startsAt);
  const end = dateLabel(endsAt);

  if (start && end) return `${start} - ${end}`;
  if (start) return `Mulai ${start}`;
  if (end) return `Sampai ${end}`;
  return "Tanpa jadwal";
}

export default async function HeroBannersPage() {
  await requireAdminSession("/admin/hero-banners");

  const db = getDb();
  const banners = await db.heroBanner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hero Banner</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Kelola banner hero yang tampil di bagian atas halaman utama.
          </p>
        </div>
        <Link
          href="/admin/hero-banners/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-bold text-white"
        >
          <Plus size={18} />
          Tambah Banner
        </Link>
      </div>

      <section className="rounded-lg border border-brand-border bg-white shadow-sm">
        <div className="hidden grid-cols-[minmax(0,2fr)_7rem_10rem_5rem_9rem] gap-3 border-b border-brand-border px-4 py-3 text-xs font-bold uppercase text-brand-muted md:grid">
          <span>Judul</span>
          <span>Status</span>
          <span>Jadwal</span>
          <span>Urutan</span>
          <span>Aksi</span>
        </div>

        <div className="divide-y divide-brand-border">
          {banners.map((banner) => {
            const imageSrc =
              banner.imageUrl && isRenderablePromoBannerImageUrl(banner.imageUrl)
                ? banner.imageUrl
                : null;

            return (
              <article
                key={banner.id}
                className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,2fr)_7rem_10rem_5rem_9rem] md:items-center md:gap-3"
              >
                <div className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-3 md:grid-cols-[4.5rem_minmax(0,1fr)]">
                  <div className="relative h-16 overflow-hidden rounded-lg bg-brand-bg">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={`Gambar ${banner.title}`}
                        fill
                        sizes="4.5rem"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-brand-muted">
                        Teks saja
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-brand-text">{banner.title}</h2>
                    {banner.subtitle ? (
                      <p className="mt-1 line-clamp-2 text-xs text-brand-muted">{banner.subtitle}</p>
                    ) : (
                      <p className="mt-1 text-xs text-brand-muted">Tanpa subjudul</p>
                    )}
                  </div>
                </div>

                <div>
                  <span className="md:hidden text-xs font-bold text-brand-muted">Status: </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      banner.isActive
                        ? "bg-success/15 text-success"
                        : "bg-brand-border/60 text-brand-muted"
                    }`}
                  >
                    {banner.isActive ? "Aktif" : "Tidak Aktif"}
                  </span>
                </div>

                <p className="text-sm text-brand-text">
                  <span className="md:hidden text-xs font-bold text-brand-muted">Jadwal: </span>
                  {scheduleLabel(banner.startsAt, banner.endsAt)}
                </p>

                <p className="text-sm text-brand-text">
                  <span className="md:hidden text-xs font-bold text-brand-muted">Urutan: </span>
                  {banner.sortOrder}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/hero-banners/${banner.id}/edit`}
                    className="rounded-lg bg-brand-bg px-3 py-1.5 text-xs font-semibold text-brand-primary"
                  >
                    Edit
                  </Link>
                  <DeleteHeroBannerButton id={banner.id} />
                </div>
              </article>
            );
          })}

          {banners.length === 0 ? (
            <div className="p-10 text-center text-sm text-brand-muted">
              Belum ada hero banner. Klik &quot;Tambah Banner&quot; untuk mulai.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
