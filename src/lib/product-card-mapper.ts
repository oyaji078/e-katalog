import type { ProductCardProps } from "@/components/ui/ProductCard";
import {
  canSeeRetailPrice,
  formatRupiah,
  getApplicableVouchers,
  getVisibleVouchers,
  productBadge,
  productImage,
  type CatalogUser,
  type ProductWithCatalogRelations,
  type VoucherWithScopeRelations,
} from "@/lib/catalog";

type ProductCardOptions = {
  user: CatalogUser;
  retailPriceEnabled: boolean;
  publicVoucherEnabled: boolean;
  retailVoucherEnabled: boolean;
  vouchers: VoucherWithScopeRelations[];
};

export function toProductCardProps(
  product: ProductWithCatalogRelations,
  options: ProductCardOptions,
): ProductCardProps {
  const showRetail = canSeeRetailPrice(options.user, options.retailPriceEnabled);
  const visibleVouchers = getVisibleVouchers(getApplicableVouchers(product, options.vouchers), {
    publicVoucherEnabled: options.publicVoucherEnabled,
    retailVoucherEnabled: options.retailVoucherEnabled,
    canSeeRetail: showRetail,
  });

  // Use slug if available, otherwise fall back to ID
  const productIdentifier = product.slug || product.id;

  return {
    href: `/products/${productIdentifier}`,
    image: productImage(product),
    name: product.name,
    specification: product.shortSpecification,
    publicPrice: formatRupiah(product.publicPrice),
    retailPrice: showRetail && product.retailPrice ? formatRupiah(product.retailPrice) : undefined,
    badge: productBadge(product),
    voucherAvailable: visibleVouchers.length > 0,
    stockStatus: product.stockStatus,
    productId: product.id,
    productSlug: product.slug,
  };
}
