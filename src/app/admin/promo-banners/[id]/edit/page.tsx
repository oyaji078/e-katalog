import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/admin-auth";
import { serializeBannerVoucher } from "@/lib/banner-voucher";
import { getDb } from "@/lib/db";
import BannerFormClient from "../../BannerFormClient";

export const dynamic = "force-dynamic";

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminSession(`/admin/promo-banners/${id}/edit`);

  const db = getDb();
  const [banner, vouchers] = await Promise.all([
    db.promoBanner.findUnique({ where: { id } }),
    db.voucher.findMany({
      orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
    }),
  ]);
  if (!banner) {
    notFound();
  }

  const serialized = {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl,
    ctaLabel: banner.ctaLabel,
    showForPublic: banner.showForPublic,
    showForRetail: banner.showForRetail,
    isActive: banner.isActive,
    startsAt: banner.startsAt?.toISOString() ?? null,
    endsAt: banner.endsAt?.toISOString() ?? null,
    sortOrder: banner.sortOrder,
    linkType: banner.linkType,
    voucherId: banner.voucherId,
    createdAt: banner.createdAt.toISOString(),
    updatedAt: banner.updatedAt.toISOString(),
  };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <section className="mx-auto max-w-3xl rounded-lg border border-brand-border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-brand-border pb-5">
          <div>
            <h1 className="text-2xl font-bold">Edit Banner Promo</h1>
            <p className="mt-1 text-sm text-brand-muted">Perbarui banner promo.</p>
          </div>
          <Link href="/admin/promo-banners" className="rounded-lg border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary">Kembali</Link>
        </div>
        <BannerFormClient mode="edit" banner={serialized} vouchers={vouchers.map(serializeBannerVoucher)} />
      </section>
    </main>
  );
}
