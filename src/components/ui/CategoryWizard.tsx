import Image from "next/image";
import Link from "next/link";

import { getCategoryIcon } from "@/lib/category-icons";

type Category = {
  slug: string;
  name: string;
  icon?: string | null;
  logoUrl?: string | null;
};

type CategoryWizardProps = {
  categories: Category[];
  activeSlug: string;
  buildHref: (categorySlug: string) => string;
};

export default function CategoryWizard({
  categories,
  activeSlug,
  buildHref,
}: CategoryWizardProps) {
  return (
    <div className="flex min-w-0 max-w-full gap-0 overflow-x-auto [scrollbar-width:none]">
      <Link
        href={buildHref("")}
        className={`relative flex shrink-0 items-center gap-1 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition ${
          activeSlug
            ? "text-[#5B6472] hover:text-[#E4D329]"
            : "text-[#E4D329] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-[#E4D329]"
        }`}
      >
        Semua
      </Link>
      {categories.map((item) => {
        const active = activeSlug === item.slug;
        const Icon = getCategoryIcon(item.icon ?? null);
        return (
          <Link
            key={item.slug}
            href={buildHref(item.slug)}
            className={`relative flex max-w-[10rem] shrink-0 items-center gap-1 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition sm:max-w-none ${
              active
                ? "text-[#E4D329] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-[#E4D329]"
                : "text-[#5B6472] hover:text-[#F0F0F5]"
            }`}
          >
            {item.logoUrl ? (
              <Image src={item.logoUrl} alt="" width={14} height={14} className="size-3.5 rounded-full object-cover" />
            ) : (
              <Icon className="size-3.5 shrink-0" />
            )}
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
