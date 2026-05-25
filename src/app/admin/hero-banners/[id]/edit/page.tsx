import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import HeroBannerFormClient from "../../HeroBannerFormClient";

export const dynamic = "force-dynamic";

export default async function EditHeroBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminSession(`/admin/hero-banners/${id}/edit`);

  const db = getDb();
  const banner = await db.heroBanner.findUnique({ where: { id } });
  if (!banner) {
    notFound();
  }

  const serialized = {
    ...banner,
    startsAt: banner.startsAt?.toISOString() ?? null,
    endsAt: banner.endsAt?.toISOString() ?? null,
    createdAt: banner.createdAt.toISOString(),
    updatedAt: banner.updatedAt.toISOString(),
  };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <section className="mx-auto max-w-3xl rounded-lg border border-brand-border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-brand-border pb-5">
          <div>
            <h1 className="text-2xl font-bold">Edit Hero Banner</h1>
            <p className="mt-1 text-sm text-brand-muted">Perbarui hero banner.</p>
          </div>
          <Link href="/admin/hero-banners" className="rounded-lg border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary">Kembali</Link>
        </div>
        <HeroBannerFormClient mode="edit" banner={serialized} />
      </section>
    </main>
  );
}
