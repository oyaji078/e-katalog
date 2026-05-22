import type {
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

export type VoucherWithScopeRelations = Voucher & {
  categories?: Array<{ id: string }>;
  products?: Array<{ productId: string }>;
};

export function formatRupiah(value: unknown) {
  const numberValue = Number(value ?? 0);
  return `Rp ${numberValue.toLocaleString("id-ID")}`;
}

export function canSeeRetailPrice(user: CatalogUser, retailPriceEnabled: boolean) {
  if (!retailPriceEnabled) return false;
  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") return true;
  return user?.retailStatus === "RETAIL_ACTIVE";
}

export function getVisibleVouchers(
  vouchers: Voucher[],
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
    if (voucher.audience === "PUBLIC") return options.publicVoucherEnabled;
    if (voucher.audience === "RETAIL") {
      return options.retailVoucherEnabled && options.canSeeRetail;
    }

    return false;
  });
}

export function voucherLabel(voucher: Pick<Voucher, "discountType" | "discountValue">) {
  if (voucher.discountType === "PERCENTAGE") {
    return `${Number(voucher.discountValue)}%`;
  }

  return formatRupiah(voucher.discountValue);
}

export function productImage(product: ProductWithCatalogRelations) {
  return product.primaryImageUrl || product.images?.[0]?.url || "";
}

export function productBadge(product: Pick<Product, "isPromo" | "stockStatus">) {
  if (product.isPromo) return "PROMO";
  if (product.stockStatus === "READY") return "READY";
  if (product.stockStatus === "LOW_STOCK") return "LOW STOCK";
  if (product.stockStatus === "PREORDER") return "PREORDER";
  return "HABIS";
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
