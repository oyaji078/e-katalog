import { Package } from "lucide-react";
import Image from "next/image";

import type { ProductCardProps } from "@/components/ui/ProductCard";
import SavedProductButton from "@/components/ui/SavedProductButton";
import TrackedProductLink from "@/components/ui/TrackedProductLink";
import WhatsAppInquiryButton from "@/components/ui/WhatsAppInquiryButton";

function compactStockLabel(value: string, status: ProductCardProps["stockStatus"]) {
  if (status === "OUT_OF_STOCK") return "Habis";
  if (status === "PREORDER") return "Pre-order";
  if (status === "LOW_STOCK") return "Stok Terbatas";
  // Strip any unit counts from legacy text, default to a clean label.
  if (/terbatas/i.test(value)) return "Stok Terbatas";
  return "Tersedia";
}

function stockDotClass(status: ProductCardProps["stockStatus"]) {
  if (status === "OUT_OF_STOCK") return "bg-[var(--color-danger)]";
  if (status === "PREORDER") return "bg-[var(--color-accent)]";
  if (status === "LOW_STOCK") return "bg-[var(--color-warning)]";
  return "bg-[var(--color-success)]";
}

function priceNumber(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function savingLabel(currentPrice: string, oldPrice: string) {
  const current = priceNumber(currentPrice);
  const old = priceNumber(oldPrice);
  return old > current && current > 0 ? `Hemat ${formatRupiah(old - current)}` : "";
}

function productBadges({
  isFlashSale,
  voucherAvailable,
  badge,
}: {
  isFlashSale: boolean;
  voucherAvailable?: boolean;
  badge?: string;
}) {
  const badges: string[] = [];
  if (isFlashSale || voucherAvailable || badge?.toUpperCase() === "FLASH SALE") badges.push("Promo");
  if (badge && badge.toUpperCase() !== "FLASH SALE" && !badges.some((item) => item.toUpperCase() === badge.toUpperCase())) {
    badges.push(badge);
  }
  return badges.slice(0, 2);
}

function isPopulerLike(badge: string) {
  const n = badge.toUpperCase();
  return n === "POPULER" || n === "POPULAR";
}

function isRekomendasiLike(badge: string) {
  const n = badge.toUpperCase();
  return n === "REKOMENDASI" || n === "RECOMMENDED";
}

function pillStyle(label: string): { background: string; color: string } {
  const n = label.toUpperCase();
  if (n === "PROMO") return { background: "#FEF2F2", color: "#991B1B" };
  if (n === "BARU" || n === "NEW") return { background: "#EFF6FF", color: "#1D4ED8" };
  return { background: "var(--color-accent-soft)", color: "var(--color-accent)" };
}

export default function FigmaProductCard({
  href,
  image,
  hoverImage,
  name,
  publicPrice,
  retailPrice,
  showRetailAsPrimary,
  badge,
  voucherAvailable,
  categoryName,
  brandName,
  productId,
  productSlug,
  flashSalePrice,
  stockStatus,
  stockText,
  isFirst = false,
  imagePriority = false,
}: ProductCardProps) {
  const isFlashSale = !!flashSalePrice;
  const basePrice = showRetailAsPrimary && retailPrice ? retailPrice : publicPrice;
  const visiblePrice = isFlashSale
    ? flashSalePrice
    : showRetailAsPrimary && retailPrice
      ? retailPrice
      : publicPrice;
  const saving = isFlashSale && flashSalePrice ? savingLabel(flashSalePrice, basePrice) : "";
  const badges = productBadges({ isFlashSale, voucherAvailable, badge });
  const hasHoverImage = Boolean(hoverImage && hoverImage !== image);

  const cornerBadge = badges.find((b) => isPopulerLike(b) || isRekomendasiLike(b));
  const topBadges = badges.filter((b) => !isPopulerLike(b) && !isRekomendasiLike(b));
  const categoryLabel = [categoryName, brandName].filter(Boolean).join(" · ") || "Produk";
  const eager = isFirst || imagePriority;

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
      <div className="relative aspect-square overflow-hidden bg-[var(--color-page)]">
        <TrackedProductLink href={href} productId={productId} source="product-card-image" className="absolute inset-0 block">
          {image ? (
            <>
              <Image
                src={image}
                alt={name}
                fill
                priority={eager}
                loading={eager ? "eager" : "lazy"}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 20vw"
                className={`object-cover transition-transform duration-200 ease-out ${
                  hasHoverImage ? "opacity-100 group-hover:opacity-0" : "group-hover:scale-[1.04]"
                }`}
              />
              {hasHoverImage ? (
                <Image
                  src={hoverImage!}
                  alt={`${name} alternate`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  className="object-cover opacity-0 transition-all duration-200 ease-out group-hover:scale-[1.04] group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <div className="flex size-full items-center justify-center">
              <Package size={42} className="text-[var(--color-border-strong)]" strokeWidth={1.5} />
            </div>
          )}
        </TrackedProductLink>

        {/* Corner-ribbon badge for Populer/Rekomendasi */}
        {cornerBadge ? (
          <div className={`corner-ribbon ${isPopulerLike(cornerBadge) ? "populer" : "rekomendasi"}`}>
            <span>{cornerBadge}</span>
          </div>
        ) : null}

        <div className="absolute left-2.5 top-2.5 z-20 flex flex-col items-start gap-1.5">
          <SavedProductButton
            productId={productId}
            productName={name}
            variant="icon"
            className="size-8 border border-black/5 bg-white/95 text-[var(--color-text-muted)] shadow-[0_2px_8px_rgba(15,23,42,0.14)] backdrop-blur hover:bg-white hover:text-[var(--color-accent)]"
          />

          {/* Standard top badges (Promo / Baru) as pills */}
          {topBadges.map((item) => {
            const s = pillStyle(item);
            return (
              <span
                key={item}
                className="rounded-md px-2 py-0.5 text-[11px] font-semibold shadow-sm"
                style={{ background: s.background, color: s.color }}
              >
                {item}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="min-w-0">
          <p className="mb-1 line-clamp-1 text-[11px] text-[var(--color-text-muted)]">
            {categoryLabel}
          </p>
          <TrackedProductLink href={href} productId={productId} source="product-card-title">
            <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-[1.4] text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
              {name}
            </h3>
          </TrackedProductLink>
        </div>

        {stockText || stockStatus ? (
          <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-muted)]">
            <span className={`size-1.5 shrink-0 rounded-full ${stockDotClass(stockStatus)}`} />
            <span className="truncate">{compactStockLabel(stockText ?? "", stockStatus)}</span>
          </div>
        ) : null}

        <div className="mt-auto min-w-0 pt-1">
          {isFlashSale ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent)]">
                Harga promo
              </p>
              <p className="truncate text-lg font-bold text-[var(--color-text)]">{visiblePrice}</p>
              <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="truncate text-xs text-[var(--color-text-light)] line-through">{basePrice}</span>
                {saving ? (
                  <span className="text-xs font-semibold text-[var(--color-success)]">{saving}</span>
                ) : null}
              </div>
            </>
          ) : showRetailAsPrimary && retailPrice ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-success)]">
                Harga retail
              </p>
              <p className="truncate text-lg font-bold text-[var(--color-success)]">{retailPrice}</p>
              <p className="mt-0.5 text-xs text-[var(--color-text-light)]">
                <span className="line-through">{publicPrice}</span>
                <span className="ml-1">harga umum</span>
              </p>
            </>
          ) : (
            <p className="truncate text-lg font-bold text-[var(--color-text)]">{visiblePrice}</p>
          )}
        </div>

        <div className="mt-2">
          <WhatsAppInquiryButton
            productId={productId}
            productSlug={productSlug ?? undefined}
            sourcePage="product-card"
            label="Tanya WA"
            className="h-[38px] w-full rounded-lg bg-[var(--color-wa)] px-3 text-[13px] font-semibold normal-case tracking-[0.01em] text-white shadow-none transition-all hover:bg-[var(--color-wa-hover)] active:scale-[0.98]"
            iconStyle={{ width: 16, height: 16 }}
          />
        </div>
      </div>
    </article>
  );
}
