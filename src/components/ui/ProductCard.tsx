import { BadgePercent, Laptop, PackageCheck, Tag } from "lucide-react";
import Image from "next/image";

import TrackedProductLink from "@/components/ui/TrackedProductLink";
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

const badgeTone: Record<string, string> = {
  Baru: "bg-brand-secondary text-brand-primary",
  Promo: "bg-brand-accent text-white",
  "Flash Sale": "bg-brand-accent text-white",
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
  stockText,
  brandName,
  categoryName,
  productId,
  productSlug,
  flashSalePrice,
}: ProductCardProps) {
  const badgeClass = badge ? badgeTone[badge] ?? "bg-brand-primary text-white" : "";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary/25 hover:shadow-lg">
      <TrackedProductLink href={href} productId={productId} source="product-card-image" className="relative block bg-brand-bg">
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
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-primary/10 to-brand-secondary/15">
              <Laptop className="size-14 text-brand-primary" />
            </div>
          )}
        </div>
        {badge ? (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2 py-1 text-[10px] font-black ${badgeClass}`}>
              {badge}
            </span>
          </div>
        ) : null}
        {voucherAvailable ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand-accent px-2 py-1 text-[10px] font-black text-white shadow-sm">
            <BadgePercent className="size-3" />
            Promo
          </span>
        ) : null}
        {showRetailAsPrimary ? (
          <span className="absolute bottom-2 right-2 rounded-full bg-brand-secondary px-2 py-1 text-[10px] font-black text-brand-primary shadow-sm">
            Harga Ritel
          </span>
        ) : null}
      </TrackedProductLink>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex min-h-6 flex-wrap items-center gap-1.5">
          {brandName ? (
            <span className="rounded-full bg-brand-primary/10 px-2 py-1 text-[10px] font-black text-brand-primary">
              {brandName}
            </span>
          ) : null}
          {categoryName ? (
            <span className="rounded-full bg-brand-bg px-2 py-1 text-[10px] font-bold text-brand-muted">
              {categoryName}
            </span>
          ) : null}
        </div>

        <TrackedProductLink href={href} productId={productId} source="product-card-title" className="mt-2 block">
          <h3 className="line-clamp-2 min-h-11 text-sm font-black leading-snug text-brand-text group-hover:text-brand-primary">
            {name}
          </h3>
        </TrackedProductLink>

        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-brand-muted">
          {specification || "Spesifikasi lengkap tersedia di detail produk."}
        </p>

        <div className="mt-3 min-h-16 rounded-xl bg-brand-bg p-3">
          {flashSalePrice ? (
            <>
              <div className="flex items-center gap-1 text-[11px] font-black text-brand-accent">
                <BadgePercent className="size-3.5 text-brand-accent" />
                Harga Flash Sale
              </div>
              <p className="mt-1 text-lg font-black leading-tight text-brand-accent">
                {flashSalePrice}
              </p>
              <p className="text-xs font-semibold text-brand-muted line-through">
                {showRetailAsPrimary && retailPrice ? retailPrice : publicPrice}
              </p>
            </>
          ) : showRetailAsPrimary && retailPrice ? (
            <>
              <div className="flex items-center gap-1 text-[11px] font-black text-brand-primary">
                <Tag className="size-3.5 text-brand-secondary" />
                Harga Ritel
              </div>
              <p className="mt-1 text-lg font-black leading-tight text-brand-primary">
                {retailPrice}
              </p>
              <p className="text-xs font-semibold text-brand-muted line-through">{publicPrice}</p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-bold text-brand-muted">Harga publik</p>
              <p className="mt-1 text-lg font-black leading-tight text-brand-accent">
                {publicPrice}
              </p>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex min-w-0 items-center gap-1 font-semibold text-brand-muted">
            <PackageCheck className="size-4 shrink-0 text-brand-secondary" />
            <span className="truncate">{stockText ?? "Cek stok"}</span>
          </span>
          {voucherAvailable ? (
            <span className="shrink-0 rounded-full bg-brand-accent/10 px-2 py-1 font-black text-brand-accent">
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
          <TrackedProductLink
            href={href}
            productId={productId}
            source="product-card-detail"
            className="inline-flex items-center justify-center rounded-xl border border-brand-primary/25 px-3 py-2.5 text-xs font-black text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary hover:text-white"
          >
            Detail
          </TrackedProductLink>
        </div>
      </div>
    </article>
  );
}
