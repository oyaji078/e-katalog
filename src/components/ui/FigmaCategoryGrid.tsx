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
  Search,
  Wifi,
} from "lucide-react";
import Link from "next/link";

const categories = [
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

type FigmaCategoryGridProps = {
  dbCategories: Array<{ name: string; slug: string }>;
};

export default function FigmaCategoryGrid({ dbCategories }: FigmaCategoryGridProps) {
  const dbSlugSet = new Set(dbCategories.map((category) => category.slug));

  return (
    <section className="mt-2 bg-white px-4 py-4 md:mx-4 md:mt-4 md:rounded-2xl">
      <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
        {categories.map((category, index) => {
          const Icon = index === categories.length - 1 ? Search : category.icon;
          const href = dbSlugSet.has(category.slug)
            ? `/products?category=${category.slug}`
            : `/products?q=${encodeURIComponent(category.name)}`;

          return (
            <Link key={category.slug} href={href} className="group flex flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-maroon focus-visible:ring-offset-2 rounded-2xl">
              <div
                className="flex size-12 items-center justify-center rounded-2xl text-primary-maroon transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg group-active:scale-95 md:size-14"
                style={{ backgroundColor: "#FFF0F4" }}
              >
                <Icon className="size-5 md:size-6" />
              </div>
              <span className="text-center text-[10px] font-semibold leading-tight text-gray-600 transition-colors group-hover:text-primary-maroon md:text-xs">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
