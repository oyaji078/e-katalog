import { statSync } from "node:fs";
import path from "node:path";

import type {
  Prisma,
  Product,
  ProductImage,
  RetailStatus,
  UserRole,
  Voucher,
  VoucherAudience,
} from "@/generated/prisma/client";

export type CatalogUser = {
  role?: UserRole | string | null;
  retailStatus?: RetailStatus | string | null;
} | null | undefined;

export type ProductWithCatalogRelations = Product & {
  images?: ProductImage[];
  vouchers?: Array<{
    voucher: Voucher;
  }>;
  category?: { name: string; slug?: string | null } | null;
  brand?: { name: string } | null;
};

/**
 * Minimal field selection for public product cards.
 * Deliberately excludes admin-only/internal fields (costPrice, margin*),
 * so they never enter Server Component payloads or reach the client.
 */
const NEW_ARRIVAL_DAYS = 30;

export function isNewArrival(createdAt: Date | string): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - NEW_ARRIVAL_DAYS);
  return new Date(createdAt) > cutoff;
}

export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  shortSpecification: true,
  publicPrice: true,
  retailPrice: true,
  primaryImageUrl: true,
  stockStatus: true,
  stockQuantity: true,
  createdAt: true,
  categoryId: true,
  category: { select: { name: true, slug: true } },
  brand: { select: { name: true } },
  images: { select: { url: true }, orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

/**
 * Field selection for the public product detail page.
 * Superset of the card fields; still excludes costPrice and margin fields.
 */
export const productDetailSelect = {
  id: true,
  name: true,
  sku: true,
  slug: true,
  description: true,
  shortSpecification: true,
  specifications: true,
  warrantyInfo: true,
  publicPrice: true,
  retailPrice: true,
  primaryImageUrl: true,
  stockStatus: true,
  stockQuantity: true,
  createdAt: true,
  categoryId: true,
  category: { select: { name: true, slug: true } },
  brand: { select: { name: true } },
  images: { select: { url: true }, orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductSelect;

export type ProductDetailData = Prisma.ProductGetPayload<{ select: typeof productDetailSelect }>;

export const voucherWithScopeSelect = {
  id: true,
  code: true,
  title: true,
  description: true,
  audience: true,
  showForPublic: true,
  showForRetail: true,
  status: true,
  discountType: true,
  discountValue: true,
  minimumPurchase: true,
  startsAt: true,
  endsAt: true,
  isActive: true,
  usageQuota: true,
  scope: true,
  createdAt: true,
  updatedAt: true,
  categoryId: true,
  categories: { select: { id: true } },
  products: { select: { productId: true } },
} satisfies Prisma.VoucherSelect;

export type VoucherWithScopeRelations = Prisma.VoucherGetPayload<{
  select: typeof voucherWithScopeSelect;
}>;

type VoucherVisibilityFields = Pick<
  Voucher,
  "isActive" | "status" | "startsAt" | "endsAt" | "showForPublic" | "showForRetail"
>;

export function formatRupiah(value: unknown) {
  const numberValue = Number(value ?? 0);
  return `Rp ${numberValue.toLocaleString("id-ID")}`;
}

export function canSeeRetailPrice(user: CatalogUser, retailPriceEnabled: boolean) {
  if (!retailPriceEnabled) return false;
  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") return true;
  return user?.retailStatus === "RETAIL_ACTIVE";
}

export function canUseRetailVoucher(user: CatalogUser) {
  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") return true;
  return user?.retailStatus === "RETAIL_ACTIVE";
}

export function getVisibleVouchers<T extends VoucherVisibilityFields>(
  vouchers: T[],
  options: {
    publicVoucherEnabled: boolean;
    retailVoucherEnabled: boolean;
    canSeeRetail: boolean;
  },
) {
  const now = new Date();

  return vouchers.filter((voucher) => {
    const isLive =
      voucher.isActive &&
      voucher.status === "ACTIVE" &&
      voucher.startsAt <= now &&
      voucher.endsAt >= now;

    if (!isLive) return false;

    if (options.canSeeRetail && voucher.showForRetail && options.retailVoucherEnabled) return true;
    if (!options.canSeeRetail && voucher.showForPublic && options.publicVoucherEnabled) return true;

    return false;
  });
}

export function voucherLabel(voucher: Pick<Voucher, "discountType" | "discountValue">) {
  if (voucher.discountType === "PERCENTAGE") {
    return `${Number(voucher.discountValue)}%`;
  }

  return formatRupiah(voucher.discountValue);
}

export function productImage(product: {
  primaryImageUrl?: string | null;
  images?: Array<{ url: string }>;
}) {
  return product.primaryImageUrl || product.images?.[0]?.url || "";
}

const publicDir = path.resolve(process.cwd(), "public");

function isPathInside(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return relative === "" || (!!relative && !relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveLocalPublicAssetPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;

  try {
    const parsed = new URL(trimmed, "http://local.invalid");
    if (parsed.origin !== "http://local.invalid") return null;

    const decodedPathname = decodeURIComponent(parsed.pathname);
    if (!decodedPathname || decodedPathname.includes("\0") || decodedPathname.includes("\\")) {
      return null;
    }

    const relativePath = decodedPathname.replace(/^\/+/, "");
    if (!relativePath) return null;

    const resolved = path.resolve(publicDir, relativePath);
    if (!isPathInside(publicDir, resolved)) return null;

    return resolved;
  } catch {
    return null;
  }
}

function isExistingPublicFile(filePath: string) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export function isValidProductImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const localPath = resolveLocalPublicAssetPath(trimmed);
  if (localPath) return isExistingPublicFile(localPath);

  return false;
}

/**
 * Render-time guard for `next/image` src values.
 * Returns the value only if it is an existing site-relative public asset;
 * otherwise null.
 *
 * This protects rendering from legacy/bad image data: unlike a CSS
 * background-image, next/image THROWS on an unparseable src and would
 * 500 the whole page. It also avoids repeated 404s for stale local image
 * paths. Complements admin save-time validation.
 */
export function safeImageSrc(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return isValidProductImageUrl(trimmed) ? trimmed : null;
  return null;
}

export function productBadge(product: Pick<Product, "stockStatus"> & { createdAt?: Date | string }) {
  if (product.createdAt && isNewArrival(product.createdAt)) return "Baru";
  return undefined;
}

export function stockLabel(
  product: Pick<Product, "stockStatus" | "stockQuantity">,
) {
  if (product.stockStatus === "READY") return `Ready ${product.stockQuantity} unit`;
  if (product.stockStatus === "LOW_STOCK") return `Stok terbatas ${product.stockQuantity} unit`;
  if (product.stockStatus === "PREORDER") return "Preorder";
  return "Stok habis";
}

export function isRetailVoucher(audience: VoucherAudience) {
  return audience === "RETAIL";
}

export function getApplicableVouchers(
  product: Pick<Product, "id" | "categoryId">,
  vouchers: VoucherWithScopeRelations[],
) {
  return vouchers.filter((voucher) => {
    if (voucher.scope === "ALL") return true;
    if (voucher.scope === "PRODUCTS") {
      return voucher.products?.some((item) => item.productId === product.id) ?? false;
    }
    if (voucher.scope === "CATEGORIES") {
      return voucher.categories?.some((category) => category.id === product.categoryId) ?? false;
    }

    return false;
  });
}

export function getEligibleProductVouchers(
  product: Pick<Product, "id" | "categoryId" | "publicPrice" | "retailPrice">,
  vouchers: VoucherWithScopeRelations[],
  options: {
    publicVoucherEnabled: boolean;
    retailVoucherEnabled: boolean;
    canSeeRetailVoucher: boolean;
    priceForMinimum: number;
    hasActiveFlashSale: boolean;
  },
) {
  if (options.hasActiveFlashSale) return [];

  const scopedVouchers = getApplicableVouchers(product, vouchers);
  const visibleVouchers = getVisibleVouchers(scopedVouchers, {
    publicVoucherEnabled: options.publicVoucherEnabled,
    retailVoucherEnabled: options.retailVoucherEnabled,
    canSeeRetail: options.canSeeRetailVoucher,
  });

  return visibleVouchers.filter((voucher) => {
    if (!voucher.minimumPurchase) return true;
    return options.priceForMinimum >= Number(voucher.minimumPurchase);
  });
}
