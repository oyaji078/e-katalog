import { notFound } from "next/navigation";

import { getDb } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

import FlashSaleFormClient from "../../FlashSaleFormClient";

export const dynamic = "force-dynamic";

export default async function EditFlashSalePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const db = getDb();
  const { id } = await params;

  const flashSale = await db.flashSale.findUnique({
    where: { id },
    include: {
      products: {
        include: { product: { select: { id: true, name: true, publicPrice: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!flashSale) notFound();

  const allProducts = await db.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, publicPrice: true },
    orderBy: { name: "asc" },
  });

  const serialized = {
    id: flashSale.id,
    name: flashSale.name,
    startsAt: flashSale.startsAt.toISOString().slice(0, 16),
    durationDays: Math.round((flashSale.endsAt.getTime() - flashSale.startsAt.getTime()) / (1000 * 60 * 60 * 24)) || 1,
    isActive: flashSale.isActive,
    products: flashSale.products.map((fp) => ({
      productId: fp.productId,
      flashSalePrice: Number(fp.flashSalePrice),
      flashSaleStock: fp.flashSaleStock,
    })),
  };

  const serializedAllProducts = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    publicPrice: Number(p.publicPrice),
  }));

  return <FlashSaleFormClient flashSale={serialized} products={serializedAllProducts} />;
}
