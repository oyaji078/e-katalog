import Image from "next/image";
import Link from "next/link";

import type { ProductCardProps } from "@/components/ui/ProductCard";
import WhatsAppInquiryButton from "@/components/ui/WhatsAppInquiryButton";

function badgeColor(badge: string) {
  if (badge === "FLASH SALE" || badge === "PROMO") return "#AE2448";
  if (badge === "READY") return "#72BAA9";
  if (badge === "Harga Ritel") return "#6E1A37";
  return "#AE2448";
}

export default function FigmaProductCard({
  href,
  image,
  name,
  specification,
  publicPrice,
  retailPrice,
  showRetailAsPrimary,
  badge,
  voucherAvailable,
  stockText,
  brandName,
  categoryName,
  productId,
  productSlug,
}: ProductCardProps) {
  const resolvedBadge = showRetailAsPrimary ? "Harga Ritel" : voucherAvailable ? "Voucher" : badge;

  return (
    <article className="group relative bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      {resolvedBadge ? (
        <span
          className="absolute left-2 top-2 z-10 rounded px-1.5 py-0.5 text-[10px] font-black text-white"
          style={{ backgroundColor: badgeColor(resolvedBadge) }}
        >
          {resolvedBadge}
        </span>
      ) : null}

      <Link href={href} className="block">
          <div className="relative aspect-square overflow-hidden bg-gray-50">
            {image ? (
              <Image
                src={image}
                alt={name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary-maroon/10 via-white to-soft-teal/25 p-4">
                <div className="flex flex-col items-center gap-2">
                  <svg className="size-12 text-primary-maroon/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  <span className="rounded-xl bg-white/90 px-3 py-1.5 text-[11px] font-black text-primary-maroon shadow-sm">
                    {categoryName ?? "Produk"}
                  </span>
                </div>
              </div>
            )}
          </div>
      </Link>

      <div className="p-2.5 md:p-3">
        <Link href={href}>
          <p className="mb-1.5 line-clamp-2 text-xs font-semibold leading-tight text-gray-700 md:text-sm">
            {name}
          </p>
        </Link>
        {specification ? (
          <p className="mb-1.5 line-clamp-1 text-[10px] font-semibold text-gray-400">
            {specification}
          </p>
        ) : null}

        {showRetailAsPrimary && retailPrice ? (
          <>
            <p className="text-sm font-black md:text-base" style={{ color: "#AE2448" }}>
              {retailPrice}
            </p>
            <p className="text-[10px] text-gray-400 line-through">{publicPrice}</p>
          </>
        ) : (
          <p className="text-sm font-black md:text-base" style={{ color: "#AE2448" }}>
            {publicPrice}
          </p>
        )}

        <div className="mt-1 text-[10px] text-gray-400">
          {brandName ? `${brandName}` : ""}{brandName && categoryName ? " · " : ""}{categoryName ?? ""}
        </div>
        {stockText ? (
          <div className="mt-0.5 text-[10px] text-gray-400">{stockText}</div>
        ) : null}

        <div className="mt-2 grid grid-cols-[1fr_auto] gap-1.5">
          <WhatsAppInquiryButton
            productId={productId}
            productSlug={productSlug ?? undefined}
            label="Tanya"
            className="w-full rounded-full px-2 py-1.5 text-[10px]"
          />
          <Link
            href={href}
            className="rounded-full bg-gray-100 px-3 py-1.5 text-center text-[10px] font-black text-primary-maroon"
          >
            Detail
          </Link>
        </div>
      </div>
    </article>
  );
}
