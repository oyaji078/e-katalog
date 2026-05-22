import ProductCard, { type ProductCardProps } from "@/components/ui/ProductCard";

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
    <div className={`grid gap-3 ${gridClasses[columns] || gridClasses[4]}`}>
      {products.map((product) => (
        <ProductCard key={product.href} {...product} />
      ))}
    </div>
  );
}
