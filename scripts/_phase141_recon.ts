import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("no DATABASE_URL");
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url, { useTextProtocol: true }) });
  try {
    const [products, active, vouchers, users, cats, brands] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.voucher.count(),
      prisma.user.count(),
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, name: true }, take: 5 }),
      prisma.brand.findMany({ where: { isActive: true }, select: { slug: true, name: true }, take: 5 }),
    ]);
    console.log(JSON.stringify({ products, active, vouchers, users, cats, brands }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
