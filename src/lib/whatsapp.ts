/**
 * WhatsApp Inquiry Utilities
 * Handles message formatting, URL building, and WhatsApp number retrieval
 */

import type { Product, StockStatus } from "@/generated/prisma/client";
import type { CatalogUser } from "@/lib/catalog";
import {
  DEFAULT_SITE_SETTINGS,
  SITE_SETTING_SINGLETON_KEY,
  normalizeWhatsappNumber,
} from "@/lib/site-settings";

/**
 * Get the store's WhatsApp number from environment as fallback.
 * Server-side callers should prefer resolveStoreWhatsappNumber() which
 * checks StoreSetting table first.
 */
export function getStoreWhatsappNumber(): string {
  const serverNumber = process.env.STORE_WHATSAPP_NUMBER;
  return normalizeWhatsappNumber(serverNumber ?? "") ?? DEFAULT_SITE_SETTINGS.whatsappNumber;
}

/**
 * Format stock status for display
 */
function formatStockStatus(status: StockStatus, quantity: number): string {
  switch (status) {
    case "READY":
      return `Tersedia (${quantity} unit)`;
    case "LOW_STOCK":
      return `Stok Terbatas (${quantity} unit)`;
    case "OUT_OF_STOCK":
      return "Habis";
    case "PREORDER":
      return "Pre-order";
    default:
      return "Status Tidak Diketahui";
  }
}

/**
 * Build WhatsApp inquiry message
 */
export interface InquiryMessageOptions {
  product: Pick<Product, "name" | "sku" | "publicPrice" | "retailPrice" | "stockStatus" | "stockQuantity" | "slug" | "id">;
  user?: CatalogUser;
  showRetailPrice: boolean;
  productLink?: string;
  voucherInfo?: string;
}

export function buildInquiryMessage(options: InquiryMessageOptions): string {
  const {
    product,
    user,
    showRetailPrice,
    productLink,
    voucherInfo,
  } = options;

  const publicPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(Number(product.publicPrice));

  const retailPrice = product.retailPrice
    ? new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(Number(product.retailPrice))
    : null;

  const stockStatus = formatStockStatus(product.stockStatus, product.stockQuantity);

  const lines: string[] = [];

  // Greeting based on user role
  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
    lines.push("Halo Admin, inquiry dari sistem admin:");
  } else if (user?.retailStatus === "RETAIL_ACTIVE") {
    lines.push("Halo Admin, saya adalah pelanggan retail dan tertarik dengan produk ini:");
  } else {
    lines.push("Halo Admin, saya tertarik dengan produk ini:");
  }

  lines.push("");
  lines.push(`Produk: ${product.name}`);
  lines.push(`SKU: ${product.sku}`);

  if (showRetailPrice && retailPrice) {
    lines.push(`Harga Retail: ${retailPrice}`);
  }

  lines.push(`Harga Publik: ${publicPrice}`);
  lines.push(`Stok: ${stockStatus}`);

  if (productLink) {
    lines.push(`Link Produk: ${productLink}`);
  }

  if (voucherInfo) {
    lines.push(`${voucherInfo}`);
  }

  lines.push("");

  if (user?.retailStatus === "RETAIL_ACTIVE") {
    lines.push("Apakah produk ini masih tersedia untuk pembelian retail?");
  } else {
    lines.push("Apakah produk ini masih tersedia?");
  }

  return lines.join("\n");
}

/**
 * Build WhatsApp inquiry URL
 */
export interface WhatsAppUrlOptions {
  message: string;
  whatsappNumber?: string;
}

export function buildWhatsappUrl(options: WhatsAppUrlOptions): string {
  const { message, whatsappNumber } = options;
  const cleanNumber =
    normalizeWhatsappNumber(whatsappNumber ?? "") ?? getStoreWhatsappNumber();

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Build product URL for inclusion in message (uses slug when available)
 */
export function buildProductUrl(
  product: Pick<Product, "id" | "slug">,
  baseUrl?: string,
): string {
  const origin = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const identifier = product.slug || product.id;
  return `${origin}/products/${identifier}`;
}

/**
 * Resolve store WhatsApp number from StoreSetting table, with env fallback.
 * Must be called from server context with a Prisma client instance.
 */
export async function resolveStoreWhatsappNumber(
  db: {
    siteSetting?: {
      findUnique: (args: { where: { singletonKey: string } }) => Promise<{ whatsappNumber: string } | null>;
    };
    storeSetting: { findUnique: (args: { where: { key: string } }) => Promise<{ value: string } | null> };
  },
): Promise<string> {
  try {
    if (db.siteSetting) {
      const siteSetting = await db.siteSetting.findUnique({
        where: { singletonKey: SITE_SETTING_SINGLETON_KEY },
      });
      const normalized = normalizeWhatsappNumber(siteSetting?.whatsappNumber ?? "");
      if (normalized) return normalized;
    }

    const setting = await db.storeSetting.findUnique({
      where: { key: "store_whatsapp_number" },
    });
    const normalized = normalizeWhatsappNumber(setting?.value ?? "");
    if (normalized) return normalized;
  } catch {
    // Fall through to env fallback
  }
  return getStoreWhatsappNumber();
}
