import { BadgePercent, Laptop, PackageCheck, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
  stockText?: string;
  brandName?: string | null;
  categoryName?: string | null;
  productId: string;
  productSlug?: string | null;
  flashSalePrice?: string;
  flashSaleStock?: number;
};

const stockTone: Record<string, string> = {
  READY: "bg-success/15 text-success",
  LOW_STOCK: "bg-warning/15 text-warning",
  OUT_OF_STOCK: "bg-danger/15 text-danger",
  PREORDER: "bg-soft-teal/15 text-primary-maroon",
};

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
  voucherLabel,
  stockStatus = "READY",
  stockText,
  brandName,
  categoryName,
  productId,
  productSlug,
}: ProductCardProps) {
  const statusClass = stockTone[stockStatus] ?? stockTone.READY;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border-gray bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary-maroon/25 hover:shadow-lg">
      <Link href={href} className="relative block bg-soft-bg">
        <div className="relative aspect-[4/3] overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-maroon/10 to-soft-teal/15">
              <Laptop className="size-14 text-primary-maroon" />
            </div>
          )}
        </div>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-1 text-[10px] font-black ${statusClass}`}>
            {badge ?? stockStatus}
          </span>
        </div>
        {voucherAvailable ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent-rose px-2 py-1 text-[10px] font-black text-white shadow-sm">
            <BadgePercent className="size-3" />
            Voucher
          </span>
        ) : null}
        {showRetailAsPrimary ? (
          <span className="absolute bottom-2 right-2 rounded-full bg-soft-teal px-2 py-1 text-[10px] font-black text-primary-maroon shadow-sm">
            Harga Ritel
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex min-h-6 flex-wrap items-center gap-1.5">
          {brandName ? (
            <span className="rounded-full bg-primary-maroon/10 px-2 py-1 text-[10px] font-black text-primary-maroon">
              {brandName}
            </span>
          ) : null}
          {categoryName ? (
            <span className="rounded-full bg-soft-bg px-2 py-1 text-[10px] font-bold text-text-muted">
              {categoryName}
            </span>
          ) : null}
        </div>

        <Link href={href} className="mt-2 block">
          <h3 className="line-clamp-2 min-h-11 text-sm font-black leading-snug text-text-dark group-hover:text-primary-maroon">
            {name}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-text-muted">
          {specification || "Spesifikasi lengkap tersedia di detail produk."}
        </p>

        <div className="mt-3 min-h-16 rounded-xl bg-soft-bg p-3">
          {showRetailAsPrimary && retailPrice ? (
            <>
              <div className="flex items-center gap-1 text-[11px] font-black text-primary-maroon">
                <Tag className="size-3.5 text-soft-teal" />
                Harga Ritel
              </div>
              <p className="mt-1 text-lg font-black leading-tight text-primary-maroon">
                {retailPrice}
              </p>
              <p className="text-xs font-semibold text-text-muted line-through">{publicPrice}</p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-bold text-text-muted">Harga publik</p>
              <p className="mt-1 text-lg font-black leading-tight text-accent-rose">
                {publicPrice}
              </p>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex min-w-0 items-center gap-1 font-semibold text-text-muted">
            <PackageCheck className="size-4 shrink-0 text-soft-teal" />
            <span className="truncate">{stockText ?? stockStatus}</span>
          </span>
          {voucherAvailable ? (
            <span className="shrink-0 rounded-full bg-accent-rose/10 px-2 py-1 font-black text-accent-rose">
              {voucherLabel ?? "Promo"}
            </span>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <WhatsAppInquiryButton
            productId={productId}
            productSlug={productSlug ?? undefined}
            sourcePage="product-card"
            label="Tanya"
            className="w-full rounded-xl px-3 py-2.5 text-xs"
          />
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-xl border border-primary-maroon/25 px-3 py-2.5 text-xs font-black text-primary-maroon transition hover:border-primary-maroon hover:bg-primary-maroon hover:text-white"
          >
            Detail
          </Link>
        </div>
      </div>
    </article>
  );
}
