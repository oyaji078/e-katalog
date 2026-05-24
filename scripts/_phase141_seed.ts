// Phase 14.1 runtime test data. All rows are prefixed P141 for easy cleanup.
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("no DATABASE_URL");
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url, { useTextProtocol: true }) });
  try {
    const category = await prisma.category.upsert({
      where: { slug: "p141-test" },
      update: { isActive: true },
      create: { name: "P141 Test Category", slug: "p141-test", isActive: true, sortOrder: 999 },
    });
    const brand = await prisma.brand.upsert({
      where: { slug: "p141-test" },
      update: { isActive: true },
      create: { name: "P141 Test Brand", slug: "p141-test", isActive: true, sortOrder: 999 },
    });

    // 30 active products -> spans 2 pages at pageSize 24.
    for (let i = 1; i <= 30; i++) {
      // Runtime test products intentionally use the polished placeholder.
      // Do not seed missing or malformed image URLs into active catalog data.
      const primaryImageUrl: string | null = null;

      const sku = `P141-SKU-${String(i).padStart(3, "0")}`;
      await prisma.product.upsert({
        where: { sku },
        update: { status: "ACTIVE", primaryImageUrl, categoryId: category.id, brandId: brand.id },
        create: {
          name: `P141 Test Laptop ${i}`,
          sku,
          slug: `p141-test-laptop-${i}`,
          description: `Phase 14.1 runtime test product ${i}.`,
          shortSpecification: "Intel Core i5 / 16GB / 512GB SSD",
          costPrice: 5_000_000,
          publicMarginType: "PERCENTAGE",
          publicMarginValue: 20,
          retailMarginType: "PERCENTAGE",
          retailMarginValue: 10,
          publicPrice: 6_000_000 + i * 1000,
          retailPrice: 5_500_000 + i * 1000,
          stockQuantity: 10,
          stockStatus: "READY",
          status: "ACTIVE",
          primaryImageUrl,
          categoryId: category.id,
          brandId: brand.id,
        },
      });
    }

    // Quota=1 PUBLIC voucher for the race test.
    const now = new Date();
    const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await prisma.voucher.upsert({
      where: { code: "P141-QUOTA1" },
      update: {
        status: "ACTIVE",
        isActive: true,
        usageQuota: 1,
        startsAt: now,
        endsAt,
        audience: "PUBLIC",
        scope: "ALL",
      },
      create: {
        code: "P141-QUOTA1",
        title: "P141 Quota One Voucher",
        description: "Phase 14.1 race-test voucher",
        audience: "PUBLIC",
        status: "ACTIVE",
        discountType: "PERCENTAGE",
        discountValue: 10,
        startsAt: now,
        endsAt,
        isActive: true,
        usageQuota: 1,
        scope: "ALL",
      },
    });

    const voucher = await prisma.voucher.findUnique({ where: { code: "P141-QUOTA1" } });
    console.log(JSON.stringify({ categoryId: category.id, brandId: brand.id, voucherId: voucher?.id, products: 30 }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
