import { getDb } from "@/lib/db";
import { safeBrandLogoSrc } from "@/lib/brand-assets";
import AdminBrandClient from "./AdminBrandClient";

export const dynamic = "force-dynamic";

export type SerializedBrand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
};

export default async function AdminBrandsPage() {
  const db = getDb();
  const brands = await db.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const serialized: SerializedBrand[] = brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description,
    logoUrl: safeBrandLogoSrc(b.logoUrl),
    isActive: b.isActive,
    sortOrder: b.sortOrder,
    productCount: b._count.products,
  }));

  return <AdminBrandClient brands={serialized} />;
}
