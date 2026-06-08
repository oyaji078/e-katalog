import Image from "next/image";
import Link from "next/link";
import SaveButton from "@/components/ui/SaveButton";
import WhatsAppInquiryButton from "@/components/ui/WhatsAppInquiryButton";

export type ProductCardProps = {
  href: string;
  image?: string | null;
  name: string;
  specification?: string | null;
  publicPrice: string;
  retailPrice?: string;
  showRetailAsPrimary?: boolean;
  badge?: string;
  voucherAvailable?: boolean;
  voucherLabel?: string;
  stockStatus?: "READY" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER";
  productId: string;
  productSlug?: string | null;
  isFirst?: boolean;
  // Extra properties from product-card-mapper (optional for forward compatibility)
  hoverImage?: string | null;
  categoryName?: string | null;
  brandName?: string | null;
  flashSalePrice?: string;
  stockText?: string;
  imagePriority?: boolean;
  flashSaleStock?: number;
};

function getBadgeStyles(badge: string | undefined) {
  if (!badge || badge === 'READY') return null;
  const normalized = badge.toUpperCase();

  if (normalized === 'PROMO') return { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200' };
  if (normalized === 'BARU') return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
  if (normalized === 'POPULER') return { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' };
  if (normalized === 'REKOMENDASI') return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
  
  return null;
}

function getStockStyles(status: ProductCardProps["stockStatus"]) {
  switch (status) {
    case 'READY':
      return { bg: 'bg-green-50', text: 'text-green-700', label: 'Ready' };
    case 'LOW_STOCK':
      return { bg: 'bg-amber-50', text: 'text-amber-900', label: 'Stok Terbatas' };
    case 'OUT_OF_STOCK':
      return { bg: 'bg-red-50', text: 'text-red-700', label: 'Out of Stock' };
    case 'PREORDER':
      return { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Preorder' };
    default:
      return null;
  }
}

export default function ProductCard({
  href,
  image,
  name,
  specification,
  publicPrice,
  retailPrice,
  showRetailAsPrimary,
  badge,
  voucherAvailable,
  stockStatus,
  productId,
  productSlug,
  isFirst,
}: ProductCardProps) {
  const basePrice = showRetailAsPrimary && retailPrice ? retailPrice : publicPrice;
  const badgeStyles = getBadgeStyles(badge);
  const stockStyles = getStockStyles(stockStatus);
  const showStockChip = stockStatus && stockStatus !== 'READY';

  return (
    <article className="group bg-white rounded-2xl border border-[var(--color-border)] shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-square rounded-t-2xl overflow-hidden bg-[var(--color-page)]">
        {/* Image */}
        {image && (
          <Link href={href}>
            <Image
              src={image}
              alt={name}
              fill
              priority={isFirst}
              loading={isFirst ? "eager" : "lazy"}
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
            />
          </Link>
        )}

        {/* Save Button - top-left (always visible) */}
        <div className="absolute top-2 left-2 z-20">
          <SaveButton
            productId={productId}
            className="border border-black/5 shadow-[0_2px_8px_rgba(15,23,42,0.14)]"
          />
        </div>

        {/* Badge - top-left, offset so it does not cover the save button */}
        {badgeStyles && (
          <span
            className={`absolute top-2 left-10 z-10 px-2 py-0.5 rounded-md text-[11px] font-semibold ${badgeStyles.bg} ${badgeStyles.text} border ${badgeStyles.border}`}
          >
            {badge}
          </span>
        )}

        {/* Stock Chip - bottom-left */}
        {showStockChip && stockStyles && (
          <span
            className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-semibold ${stockStyles.bg} ${stockStyles.text}`}
          >
            {stockStyles.label}
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Product Name - clickable */}
        <Link href={href}>
          <h3 className="text-sm font-semibold text-[var(--color-text)] line-clamp-2 leading-snug hover:text-[var(--color-accent)] transition cursor-pointer">
            {name}
          </h3>
        </Link>

        {/* Specification */}
        {specification && (
          <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">
            {specification}
          </p>
        )}

        {/* Price */}
        <div className="mt-1">
          <p className="text-base font-bold text-[var(--color-accent)]">
            {basePrice}
          </p>
          {retailPrice && showRetailAsPrimary && publicPrice && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Public: <span className="font-semibold">{publicPrice}</span>
            </p>
          )}
          {retailPrice && !showRetailAsPrimary && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Retail: <span className="font-semibold text-[var(--color-success)]">{retailPrice}</span>
            </p>
          )}
        </div>

        {/* Voucher available badge */}
        {voucherAvailable && (
          <div className="text-[11px] text-purple-700 flex items-center gap-1">
            🎟 Voucher tersedia
          </div>
        )}

        {/* WhatsApp CTA - at bottom, single button */}
        <WhatsAppInquiryButton
          productId={productId}
          productSlug={productSlug ?? undefined}
          sourcePage="product-card"
          className="mt-auto w-full"
        />
      </div>
    </article>
  );
}
