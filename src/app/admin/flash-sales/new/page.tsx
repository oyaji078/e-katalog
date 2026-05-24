import { getDb } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

import FlashSaleFormClient from "../FlashSaleFormClient";

export const dynamic = "force-dynamic";

export default async function NewFlashSalePage() {
  await requireAdminSession();
  const db = getDb();

  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, publicPrice: true },
    orderBy: { name: "asc" },
  });

  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    publicPrice: Number(p.publicPrice),
  }));

  return <FlashSaleFormClient products={serialized} />;
}
