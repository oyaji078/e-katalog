/**
 * Demo Seed Script — Phase 16 Client Demo Finalization
 *
 * Creates local demo users and updates demo data for client presentation.
 * This script runs only in development/local environments.
 *
 * WARNING: This script creates users with known passwords for demo purposes.
 * Do NOT run on production databases.
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword as betterHashPassword } from "@better-auth/utils/password";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_PASSWORD = "Demo1234!";

const demoUsers = [
  {
    name: "Admin Demo",
    email: "admin@demo.ekatalog",
    password: DEMO_PASSWORD,
    role: "ADMIN" as const,
    retailStatus: "RETAIL_ACTIVE" as const,
    whatsappNumber: "6281111111111",
    storeName: "Demo Store Admin",
    userCode: "DEMO-ADMIN",
  },
  {
    name: "Super Admin Demo",
    email: "superadmin@demo.ekatalog",
    password: DEMO_PASSWORD,
    role: "SUPER_ADMIN" as const,
    retailStatus: "RETAIL_ACTIVE" as const,
    whatsappNumber: "6282222222222",
    storeName: "Demo Store Super Admin",
    userCode: "DEMO-SUPERADMIN",
  },
  {
    name: "Retail Aktif Demo",
    email: "retail@demo.ekatalog",
    password: DEMO_PASSWORD,
    role: "USER" as const,
    retailStatus: "RETAIL_ACTIVE" as const,
    whatsappNumber: "6283333333333",
    storeName: "Demo Store Retail",
    userCode: "DEMO-RETAIL",
  },
  {
    name: "Retail Pending Demo",
    email: "pending@demo.ekatalog",
    password: DEMO_PASSWORD,
    role: "USER" as const,
    retailStatus: "PENDING_RETAIL" as const,
    whatsappNumber: "6284444444444",
    storeName: "Demo Store Pending",
    userCode: "DEMO-PENDING",
  },
  {
    name: "User Biasa Demo",
    email: "user@demo.ekatalog",
    password: DEMO_PASSWORD,
    role: "USER" as const,
    retailStatus: "REGISTERED" as const,
    whatsappNumber: "6285555555555",
    userCode: "DEMO-USER",
  },
];

async function hashDemoPassword(password: string): Promise<string> {
  return betterHashPassword(password);
}

const voucherUpdates = [
  {
    code: "TES-VC-001",
    title: "Promo Pelajar & Mahasiswa",
    description: "Nikmati diskon spesial aksesoris dan laptop untuk pelajar dan mahasiswa.",
    minimumPurchase: 100000,
  },
  {
    code: "P141-QUOTA1",
    title: "Voucher Diskon Produk Pilihan",
    description: "Voucher diskon untuk produk-produk pilihan. Klaim sekarang sebelum habis!",
    minimumPurchase: 250000,
  },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL!;
  const adapter = new PrismaMariaDb(databaseUrl, { useTextProtocol: true });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("=== Creating demo users ===");

    for (const user of demoUsers) {
      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      if (existing) {
        console.log(`  User already exists: ${user.email} — updating role/status`);
        await prisma.user.update({
          where: { email: user.email },
          data: {
            role: user.role,
            retailStatus: user.retailStatus,
            name: user.name,
            whatsappNumber: user.whatsappNumber,
            storeName: user.storeName,
          },
        });
        continue;
      }

      const userId = randomUUID();
      const hashed = await hashDemoPassword(user.password);

      await prisma.user.create({
        data: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
          retailStatus: user.retailStatus,
          whatsappNumber: user.whatsappNumber,
          storeName: user.storeName,
          userCode: user.userCode,
          emailVerified: true,
        },
      });

      await prisma.account.create({
        data: {
          id: randomUUID(),
          userId,
          accountId: user.email,
          providerId: "credential",
          password: hashed,
        },
      });

      console.log(`  Created: ${user.email} (${user.role}, ${user.retailStatus})`);
    }

    console.log("\n=== Updating voucher demo data ===");

    for (const update of voucherUpdates) {
      const voucher = await prisma.voucher.findUnique({ where: { code: update.code } });
      if (!voucher) {
        console.log(`  Voucher not found: ${update.code} — skipping`);
        continue;
      }
      await prisma.voucher.update({
        where: { code: update.code },
        data: {
          title: update.title,
          description: update.description,
          minimumPurchase: update.minimumPurchase,
        },
      });
      console.log(`  Updated: ${update.code} → "${update.title}" (min Rp ${update.minimumPurchase.toLocaleString("id-ID")})`);
    }

    console.log("\n=== Demo seed complete ===");
    console.log("\nDemo credentials (for local dev only):");
    console.log("  Admin:          admin@demo.ekatalog / Demo1234!");
    console.log("  Super Admin:    superadmin@demo.ekatalog / Demo1234!");
    console.log("  Retail Active:  retail@demo.ekatalog / Demo1234!");
    console.log("  Retail Pending: pending@demo.ekatalog / Demo1234!");
    console.log("  Regular User:   user@demo.ekatalog / Demo1234!");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
