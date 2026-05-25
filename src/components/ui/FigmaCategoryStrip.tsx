import Link from "next/link";

import { getCategoryIcon } from "@/lib/category-icons";

type FigmaCategoryStripProps = {
  dbCategories: Array<{ name: string; slug: string; icon: string | null }>;
};

export default function FigmaCategoryStrip({ dbCategories }: FigmaCategoryStripProps) {
  if (dbCategories.length === 0) return null;

  return (
    <section id="kategori" className="border-b border-brand-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brand-accent">
              Kategori populer
            </p>
            <h2 className="text-lg font-black text-brand-text">Cari berdasarkan kebutuhan</h2>
          </div>
          <Link href="/products" className="text-xs font-black text-brand-primary">
            Semua produk
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {dbCategories.map((category) => {
            const Icon = getCategoryIcon(category.icon);

            return (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-brand-border bg-brand-bg px-2 py-3 text-center transition hover:border-brand-primary hover:bg-white hover:shadow-sm"
              >
                <span className="flex size-10 items-center justify-center rounded-2xl bg-white text-brand-primary shadow-sm group-hover:bg-brand-primary group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <span className="text-[11px] font-black leading-tight text-brand-text">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
