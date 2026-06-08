import Link from "next/link";
import Image from "next/image";

import { getCategoryIcon } from "@/lib/category-icons";

type FigmaCategoryGridProps = {
  dbCategories: Array<{ name: string; slug: string; icon: string | null; logoUrl?: string | null }>;
};

export default function FigmaCategoryGrid({ dbCategories }: FigmaCategoryGridProps) {
  if (dbCategories.length === 0) return null;

  return (
    <section id="kategori" className="mt-2 bg-white px-4 py-4 md:mx-4 md:mt-4 md:rounded-2xl">
      <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
        {dbCategories.map((category) => {
          const Icon = getCategoryIcon(category.icon);

          return (
            <Link key={category.slug} href={`/products?category=${category.slug}`} className="group flex flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded-2xl">
              <div className="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft text-brand-primary transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg group-active:scale-95 md:size-14">
                {category.logoUrl ? (
                  <Image src={category.logoUrl} alt="" width={56} height={56} className="size-full object-cover" />
                ) : (
                  <Icon className="size-5 md:size-6" />
                )}
              </div>
              <span className="text-center text-[10px] font-semibold leading-tight text-gray-600 transition-colors group-hover:text-brand-primary md:text-xs">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
