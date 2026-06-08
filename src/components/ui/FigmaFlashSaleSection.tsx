"use client";

import { ChevronRight, Laptop, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import SavedProductButton from "@/components/ui/SavedProductButton";
import WhatsAppInquiryButton from "@/components/ui/WhatsAppInquiryButton";

type FigmaFlashProduct = {
  href: string;
  image?: string | null;
  name: string;
  publicPrice: string;
  retailPrice?: string;
  showRetailAsPrimary?: boolean;
  flashSalePrice?: string;
  badge?: string;
  stockText?: string;
  productId: string;
  productSlug?: string | null;
};

type FigmaFlashSaleSectionProps = {
  products: FigmaFlashProduct[];
  endsAt?: string;
  initialNow?: number;
};

function pad(number: number) {
  return String(number).padStart(2, "0");
}

function getRemaining(endsAt: string, now: number) {
  const diff = Math.max(0, new Date(endsAt).getTime() - now);
  const totalSeconds = Math.floor(diff / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h, m, s, done: diff <= 0 };
}

function FlashPlaceholder() {
  return (
    <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#294669] to-[#E4D329]/30">
      <div className="flex flex-col items-center gap-2">
        <Laptop className="size-10 text-[#E4D329]" strokeWidth={1.5} />
        <span className="border border-[#2A2A38] bg-[#14161E]/80 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F0F0F5]">
          Produk
        </span>
      </div>
    </div>
  );
}

function FlashCountdown({ endsAt, initialNow }: { endsAt: string; initialNow?: number }) {
  const [now, setNow] = useState(initialNow ?? new Date(endsAt).getTime());
  const remaining = useMemo(() => getRemaining(endsAt, now), [endsAt, now]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Re-sync the SSR-stable seed to the real client clock on mount, then tick.
    const update = () => setNow(Date.now());
    update();
    if (prefersReducedMotion) return;

    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8A9E] sm:inline">
        Berakhir
      </span>
      {[remaining.h, remaining.m, remaining.s].map((value, index) => (
        <span key={`${index}-${value}`} className="contents">
          <span className="border border-[#2A2A38] bg-[#1C1E26] px-2 py-1 font-mono text-xs font-black text-[#F0F0F5]">
            {pad(value)}
          </span>
          {index < 2 ? <span className="text-xs font-black text-[#E4D329]">:</span> : null}
        </span>
      ))}
    </div>
  );
}

export default function FigmaFlashSaleSection({
  products,
  endsAt,
  initialNow,
}: FigmaFlashSaleSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto mt-10 max-w-[1400px] overflow-hidden border-y border-[#2A2A38] bg-[#14161E]">
      <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap size={18} fill="#E4D329" stroke="none" />
            <span className="text-sm font-black uppercase tracking-[0.22em] text-[#F0F0F5] md:text-base">
              Flash Sale
            </span>
          </div>
          {endsAt ? <FlashCountdown endsAt={endsAt} initialNow={initialNow} /> : null}
        </div>
        <Link
          href="/products?flashSale=1"
          className="flex shrink-0 items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8A9E] transition-colors hover:text-[#E4D329]"
        >
          Lihat Semua <ChevronRight size={13} />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-5 [scrollbar-width:none] md:px-6">
        {products.map((product, index) => (
          <div
            key={`${product.href}-${index}`}
            className="group w-40 flex-shrink-0 overflow-hidden border border-[#2A2A38] bg-[#14161E] text-[#F0F0F5] transition-all duration-300 hover:-translate-y-1 hover:border-[#E4D329] hover:shadow-[0_4px_16px_rgba(228,211,41,0.16)] md:w-48"
          >
            <div className="relative h-44 w-full overflow-hidden bg-[#1C1E26] md:h-56">
              <Link href={product.href} className="relative block size-full">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 160px, 192px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <FlashPlaceholder />
                )}
                <span className="absolute left-2 top-2 bg-[#E4D329] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#0D0B61]">
                  {product.badge ?? "Promo"}
                </span>
              </Link>
              <SavedProductButton
                productId={product.productId}
                productName={product.name}
                variant="icon"
                className="absolute right-2 top-2 z-10 border-[#2A2A38] bg-[#14161E] text-[#F0F0F5] hover:text-[#E4D329]"
              />
            </div>
            <div className="p-3">
              <Link href={product.href}>
                <p className="mb-2 line-clamp-2 text-xs font-semibold leading-tight text-[#F0F0F5] transition-colors group-hover:text-[#E4D329]">
                  {product.name}
                </p>
              </Link>
              {product.flashSalePrice ? (
                <>
                  <p className="text-sm font-black text-[#E4D329]">{product.flashSalePrice}</p>
                  <p className="mt-0.5 text-[10px] text-[#5B6472] line-through">
                    {product.showRetailAsPrimary && product.retailPrice
                      ? product.retailPrice
                      : product.publicPrice}
                  </p>
                </>
              ) : product.showRetailAsPrimary && product.retailPrice ? (
                <>
                  <p className="text-sm font-black text-[#E4D329]">{product.retailPrice}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A8A9E]">
                    Harga ritel
                  </p>
                </>
              ) : (
                <p className="text-sm font-black text-[#E4D329]">{product.publicPrice}</p>
              )}
              <p className="mt-2 truncate text-[10px] text-[#8A8A9E]">
                {product.stockText ?? "Cek stok"}
              </p>
              <WhatsAppInquiryButton
                productId={product.productId}
                productSlug={product.productSlug ?? undefined}
                sourcePage="flash-sale"
                label="Tanya WA"
                className="mt-3 h-8 w-full rounded-none bg-[#22C55E] px-2 text-[11px] font-black uppercase tracking-wider text-white shadow-none hover:bg-[#22C55E]/90"
              />
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-[#E4D329]/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </section>
  );
}
