import Link from "next/link";

type CategoryGridProps = {
  categories: Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  columns?: number;
};

export default function CategoryGrid({
  categories,
  columns = 5,
}: CategoryGridProps) {
  // Responsive grid columns
  const gridClasses: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  };

  return (
    <section className={`mt-6 grid gap-3 ${gridClasses[columns] || "grid-cols-5"} sm:grid-cols-3 lg:grid-cols-5`}>
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Link
            key={category.label}
            href="#"
            className="rounded-2xl border border-border-gray bg-white p-4 shadow-sm flex flex-col items-center"
          >
            <Icon className="mb-3 size-6 text-soft-teal" />
            <p className="font-semibold text-center text-xs">{category.label}</p>
          </Link>
        );
      })}
    </section>
  );
}