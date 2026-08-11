import type { ProductCardProps } from "@/components/ui/ProductCard";
import {
  canSeeRetailPrice,
  canUseRetailVoucher,
  formatRupiah,
  getEligibleProductVouchers,
  productBadge,
  productHoverImage,
  productImage,
  safeImageSrc,
  stockLabel,
  type CatalogUser,
  type ProductCardData,
  type VoucherWithScopeRelations,
  voucherLabel,
} from "@/lib/catalog";

type ProductCardOptions = {
  user: CatalogUser;
  retailPriceEnabled: boolean;
  publicVoucherEnabled: boolean;
  retailVoucherEnabled: boolean;
  vouchers: VoucherWithScopeRelations[];
  flashSalePrice?: number;
  flashSaleStock?: number;
  hasActiveFlashSale?: boolean;
};

export function toProductCardProps(
  product: ProductCardData,
  options: ProductCardOptions,
): ProductCardProps {
  const showRetail = canSeeRetailPrice(options.user, options.retailPriceEnabled);
  const canSeeRetailVoucher = canUseRetailVoucher(options.user);
  const hasVisibleFlashSale = typeof options.flashSalePrice === "number";
  const priceForMinimum = showRetail && product.retailPrice ? Number(product.retailPrice) : Number(product.publicPrice);
  const visibleVouchers = getEligibleProductVouchers(product, options.vouchers, {
    publicVoucherEnabled: options.publicVoucherEnabled,
    retailVoucherEnabled: options.retailVoucherEnabled,
    canSeeRetailVoucher,
    priceForMinimum,
    hasActiveFlashSale: options.hasActiveFlashSale ?? hasVisibleFlashSale,
  });

  const productIdentifier = product.slug || product.sku;

  return {
    href: `/products/${productIdentifier}`,
    image: safeImageSrc(productImage(product)),
    hoverImage: safeImageSrc(productHoverImage(product)),
    name: product.name,
    specification: product.shortSpecification,
    publicPrice: formatRupiah(product.publicPrice),
    retailPrice: showRetail && product.retailPrice ? formatRupiah(product.retailPrice) : undefined,
    showRetailAsPrimary: showRetail && !!product.retailPrice,
    badge: hasVisibleFlashSale || visibleVouchers.length > 0
      ? "Promo"
      : productBadge(product),
    voucherAvailable: visibleVouchers.length > 0,
    voucherLabel: visibleVouchers[0] ? voucherLabel(visibleVouchers[0]) : undefined,
    stockStatus: product.stockStatus,
    stockText: stockLabel(product),
    brandName: product.brand?.name ?? null,
    categoryName: product.category?.name ?? null,
    productId: productIdentifier,
    productSlug: product.slug,
    flashSalePrice: hasVisibleFlashSale ? formatRupiah(options.flashSalePrice) : undefined,
    flashSaleStock: options.flashSaleStock,
  };
}

