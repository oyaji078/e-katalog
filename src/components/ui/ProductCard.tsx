import Link from "next/link";
import { Laptop } from "lucide-react";

import WhatsAppInquiryButton from "@/components/ui/WhatsAppInquiryButton";

export type ProductCardProps = {
  href: string;
  image?: string | null;
  name: string;
  specification?: string | null;
  publicPrice: string;
  retailPrice?: string;
  badge?: string;
  voucherAvailable?: boolean;
  stockStatus?: "READY" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER";
  productId: string;
  productSlug?: string | null;
};

export default function ProductCard({
  href,
  image,
  name,
  specification,
  publicPrice,
  retailPrice,
  badge,
  voucherAvailable,
  stockStatus,
  productId,
  productSlug,
}: ProductCardProps) {
  return (
    <article className="rounded-lg border border-border-gray bg-white p-3 shadow-sm transition hover:shadow-md">
      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden rounded-md bg-soft-bg">
          {image ? (
            <div
              aria-label={name}
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url("${image}")` }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Laptop className="size-12 text-primary-maroon" />
            </div>
          )}
          {badge && (
            <span className="absolute left-2 top-2 rounded-full bg-soft-teal/15 px-2 py-1 text-[11px] font-bold text-primary-maroon">
              {badge}
            </span>
          )}
          {voucherAvailable && (
            <span className="absolute right-2 top-2 rounded-full bg-accent-rose/20 px-2 py-1 text-[11px] font-bold text-accent-rose">
              Voucher
            </span>
          )}
          {stockStatus === "LOW_STOCK" && (
            <span className="absolute bottom-2 left-2 rounded-full bg-warning/20 px-2 py-1 text-[11px] font-bold text-warning">
              Low Stock
            </span>
          )}
          {stockStatus === "OUT_OF_STOCK" && (
            <span className="absolute bottom-2 left-2 rounded-full bg-danger/20 px-2 py-1 text-[11px] font-bold text-danger">
              Habis
            </span>
          )}
          {stockStatus === "PREORDER" && (
            <span className="absolute bottom-2 left-2 rounded-full bg-soft-teal/20 px-2 py-1 text-[11px] font-bold text-primary-maroon">
              Preorder
            </span>
          )}
        </div>
      </Link>
      <div className="mt-3">
        <Link href={href} className="block">
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-text-dark">{name}</h3>
        </Link>
        {specification ? (
          <p className="mt-1 line-clamp-2 min-h-8 text-xs text-text-muted">{specification}</p>
        ) : null}
        <div className="mt-2 space-y-1">
          <p className="font-bold text-accent-rose">{publicPrice}</p>
          {retailPrice ? (
            <p className="text-sm font-bold text-soft-teal">
              <span className="text-xs font-semibold text-text-muted">Retail: </span>
              {retailPrice}
            </p>
          ) : null}
        </div>
        {voucherAvailable && (
          <span className="mt-1 block text-xs text-accent-rose">Voucher tersedia</span>
        )}
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <WhatsAppInquiryButton
            productId={productId}
            productSlug={productSlug ?? undefined}
            sourcePage="product-card"
            label="WhatsApp"
          />
          <Link
            href={href}
            className="rounded-md border border-primary-maroon px-3 py-2 text-center text-xs font-bold text-primary-maroon"
          >
            Detail
          </Link>
        </div>
      </div>
    </article>
  );
}
