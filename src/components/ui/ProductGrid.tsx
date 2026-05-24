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
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
  };

  return (
    <div className={`grid overflow-hidden rounded-2xl bg-gray-100 gap-px ${gridClasses[columns] || gridClasses[4]}`}>
      {products.map((product) => (
        <FigmaProductCard key={product.href} {...product} />
      ))}
    </div>
  );
}
