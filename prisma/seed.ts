import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const featureFlags = [
  {
    key: "enable_retail_registration",
    name: "Retail Registration",
    description: "Allow users to create retail-pending accounts.",
    enabled: true,
  },
  {
    key: "enable_retail_token_activation",
    name: "Retail Token Activation",
    description: "Allow pending retail users to activate accounts with admin-generated tokens.",
    enabled: true,
  },
  {
    key: "enable_retail_whatsapp_request",
    name: "Retail WhatsApp Request",
    description: "Allow users to request retail tokens through WhatsApp.",
    enabled: true,
  },
  {
    key: "enable_retail_price",
    name: "Retail Price",
    description: "Show retail prices to active retail users and staff.",
    enabled: true,
  },
  {
    key: "enable_public_voucher",
    name: "Public Voucher",
    description: "Show public voucher cards on catalog surfaces.",
    enabled: true,
  },
  {
    key: "enable_retail_voucher",
    name: "Retail Voucher",
    description: "Show retail-only vouchers to active retail users and staff.",
    enabled: true,
  },
  {
    key: "enable_margin_management",
    name: "Margin Management",
    description: "Enable price and margin management for store staff.",
    enabled: true,
  },
  {
    key: "enable_inquiry_tracking",
    name: "Inquiry Tracking",
    description: "Record WhatsApp inquiry attempts for reporting.",
    enabled: true,
  },
  {
    key: "enable_product_import",
    name: "Product Import",
    description: "Enable controlled product import workflows.",
    enabled: false,
  },
  {
    key: "enable_promo_banner",
    name: "Promo Banner",
    description: "Show managed promotional banners.",
    enabled: true,
  },
  {
    key: "enable_hero_banner",
    name: "Hero Banner",
    description: "Show managed hero carousel banners on the homepage.",
    enabled: true,
  },
  {
    key: "enable_maintenance_mode",
    name: "Maintenance Mode",
    description: "Allow Super Admin to place the catalog in maintenance mode.",
    enabled: false,
  },
  {
    key: "enable_admin_activity_log",
    name: "Admin Activity Log",
    description: "Record critical admin and super admin actions.",
    enabled: true,
  },
] as const;

const storeSettings = [
  {
    key: "store_name",
    value: "E-Katalog Komputer",
    description: "Public store name.",
    isSecret: false,
  },
  {
    key: "store_whatsapp_number",
    value: "6280000000000",
    description: "Placeholder WhatsApp number; replace in production settings.",
    isSecret: false,
  },
  {
    key: "deployment_provider",
    value: "Hostinger",
    description: "Safe deployment provider label for system status pages.",
    isSecret: false,
  },
  {
    key: "ci_provider",
    value: "GitHub Actions",
    description: "Safe CI provider label for system status pages.",
    isSecret: false,
  },
] as const;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run prisma/seed.ts.");
  }

  const adapter = new PrismaMariaDb(databaseUrl, { useTextProtocol: true });
  const prisma = new PrismaClient({ adapter });

  try {
    for (const flag of featureFlags) {
      await prisma.featureFlag.upsert({
        where: { key: flag.key },
        update: {
          name: flag.name,
          description: flag.description,
          enabled: flag.enabled,
        },
        create: flag,
      });
    }

    for (const setting of storeSettings) {
      await prisma.storeSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          description: setting.description,
          isSecret: setting.isSecret,
        },
        create: setting,
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
