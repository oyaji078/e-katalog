import { getDb } from "@/lib/db";
import { safeCategoryLogoSrc } from "@/lib/category-assets";
import AdminCategoryClient from "./AdminCategoryClient";

export const dynamic = "force-dynamic";

export type SerializedCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  logoUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
};

export default async function AdminCategoriesPage() {
  const db = getDb();
  const categories = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const serialized: SerializedCategory[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    logoUrl: safeCategoryLogoSrc(c.logoUrl),
    isActive: c.isActive,
    sortOrder: c.sortOrder,
    productCount: c._count.products,
  }));

  return <AdminCategoryClient categories={serialized} />;
}
