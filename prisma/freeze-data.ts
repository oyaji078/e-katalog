/**
 * Phase 17: Freeze demo data state.
 * Renames test categories, polishes remaining voucher data.
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL!;
const adapter = new PrismaMariaDb(dbUrl, { useTextProtocol: true });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Rename P141 Test Category to client-friendly name
  const p141Cat = await prisma.category.findUnique({ where: { slug: "p141-test" } });
  if (p141Cat) {
    await prisma.category.update({
      where: { slug: "p141-test" },
      data: { name: "Laptop Demo", description: "Koleksi laptop demo untuk presentasi katalog." },
    });
    console.log("Renamed category: P141 Test Category -> Laptop Demo");
  }

  // 2. Ensure all active vouchers have reasonable minimumPurchase
  const vouchers = await prisma.voucher.findMany({
    where: { status: "ACTIVE", isActive: true },
  });
  for (const v of vouchers) {
    if (v.minimumPurchase === null || v.minimumPurchase.toNumber() < 1000) {
      await prisma.voucher.update({
        where: { id: v.id },
        data: { minimumPurchase: 100000 },
      });
      console.log(`Fixed min purchase for ${v.code}: -> Rp 100.000`);
    }
  }

  // 3. Keep products without uploaded local images on the styled placeholder.
  // Remote demo images are intentionally not seeded for offline client review.

  await prisma.$disconnect();
  console.log("\nFreeze data complete.");
}

main().catch((e) => { console.error(e); process.exit(1); });
