import {
  Camera,
  Cpu,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  Monitor,
  Mouse,
  Printer,
  Wifi,
} from "lucide-react";
import Link from "next/link";

const shortcuts = [
  { name: "Laptop", slug: "laptop", icon: Laptop },
  { name: "PC Rakitan", slug: "pc-rakitan", icon: Cpu },
  { name: "Monitor", slug: "monitor", icon: Monitor },
  { name: "Keyboard", slug: "keyboard", icon: Keyboard },
  { name: "Mouse", slug: "mouse", icon: Mouse },
  { name: "Printer", slug: "printer", icon: Printer },
  { name: "Networking", slug: "networking", icon: Wifi },
  { name: "CCTV", slug: "cctv", icon: Camera },
  { name: "Storage", slug: "storage", icon: HardDrive },
  { name: "Aksesoris", slug: "aksesoris", icon: Headphones },
];

type FigmaCategoryStripProps = {
  dbCategories: Array<{ name: string; slug: string }>;
};

export default function FigmaCategoryStrip({ dbCategories }: FigmaCategoryStripProps) {
  const dbSlugSet = new Set(dbCategories.map((category) => category.slug));

  return (
    <section id="kategori" className="border-b border-border-gray bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-accent-rose">
              Kategori populer
            </p>
            <h2 className="text-lg font-black text-text-dark">Cari berdasarkan kebutuhan</h2>
          </div>
          <Link href="/products" className="text-xs font-black text-primary-maroon">
            Semua produk
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {shortcuts.map((category) => {
            const Icon = category.icon;
            const href = dbSlugSet.has(category.slug)
              ? `/products?category=${category.slug}`
              : `/products?q=${encodeURIComponent(category.name)}`;

            return (
              <Link
                key={category.slug}
                href={href}
                className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border-gray bg-soft-bg px-2 py-3 text-center transition hover:border-primary-maroon hover:bg-white hover:shadow-sm"
              >
                <span className="flex size-10 items-center justify-center rounded-2xl bg-white text-primary-maroon shadow-sm group-hover:bg-primary-maroon group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <span className="text-[11px] font-black leading-tight text-text-dark">
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
