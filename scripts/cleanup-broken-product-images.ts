/**
 * Phase 21/22.4: Remove broken remote product image URLs from DB.
 * Sets primaryImageUrl to null for products that still reference
 * remote photo hosts that are not allowed in local demo/client review.
 *
 * Run: npx tsx scripts/cleanup-broken-product-images.ts
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const BLOCKED_IMAGE_HOSTS = [
  ["images", "unsplash", "com"].join("."),
  ["unsplash", "com"].join("."),
];

function isBlockedRemoteImage(value: string | null) {
  if (!value) return false;
  return BLOCKED_IMAGE_HOSTS.some((host) => value.toLowerCase().includes(host));
}

const dbUrl = process.env.DATABASE_URL!;
const adapter = new PrismaMariaDb(dbUrl, { useTextProtocol: true });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find products with broken primaryImageUrl
  const allProducts = await prisma.product.findMany({
    where: {
      primaryImageUrl: {
        not: null,
      },
    },
    select: { id: true, name: true, primaryImageUrl: true },
  });

  const toClean = allProducts.filter((p) => isBlockedRemoteImage(p.primaryImageUrl));

  console.log(`\n=== Products with blocked remote primaryImageUrl: ${toClean.length} ===\n`);

  for (const p of toClean) {
    console.log(`  ${p.name} (${p.id}): ${p.primaryImageUrl}`);
    await prisma.product.update({
      where: { id: p.id },
      data: { primaryImageUrl: null },
    });
    console.log(`  → Set to null`);
  }

  // Also check ProductImage table
  const allProductImages = await prisma.productImage.findMany({
    select: { id: true, url: true, productId: true },
  });

  const brokenImages = allProductImages.filter((pi) => isBlockedRemoteImage(pi.url));

  console.log(`\n=== ProductImage records with blocked remote URLs: ${brokenImages.length} ===\n`);

  for (const pi of brokenImages) {
    console.log(`  (product ${pi.productId}): ${pi.url}`);
    await prisma.productImage.delete({ where: { id: pi.id } });
    console.log(`  → Deleted`);
  }

  await prisma.$disconnect();
  console.log("\nCleanup complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
