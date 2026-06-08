import FigmaProductCard from "@/components/ui/FigmaProductCard";
import type { ProductCardProps } from "@/components/ui/ProductCard";

type ProductGridProps = {
  products: ProductCardProps[];
  columns?: number;
};

export default function ProductGrid({
  products,
  columns = 4,
}: ProductGridProps) {
  const gridClasses: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5",
    5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5",
  };

  return (
    <div
      className={`grid min-w-0 items-stretch gap-2 sm:gap-3 lg:gap-4 ${gridClasses[columns] || gridClasses[4]}`}
    >
      {products.map((product, index) => (
        <FigmaProductCard
          key={product.href}
          {...product}
          isFirst={index < 5}
          imagePriority={index === 0}
        />
      ))}
    </div>
  );
}
