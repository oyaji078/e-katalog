"use client";

import { ChevronRight, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
};

function pad(number: number) {
  return String(number).padStart(2, "0");
}

function FlashPlaceholder() {
  return (
    <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-primary/10 via-white to-brand-secondary/25">
      <div className="flex flex-col items-center gap-2">
        <svg className="size-10 text-brand-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-brand-primary shadow-sm">
          Produk
        </span>
      </div>
    </div>
  );
}

export default function FigmaFlashSaleSection({ products }: FigmaFlashSaleSectionProps) {
  const [timeLeft, setTimeLeft] = useState({ h: 7, m: 32, s: 45 });

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        let { h, m, s } = previous;
        s -= 1;
        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }
        if (h < 0) return { h: 23, m: 59, s: 59 };
        return { h, m, s };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      className="mt-2 overflow-hidden md:mx-4 md:mt-4 md:rounded-2xl"
      style={{
        background:
          "linear-gradient(180deg, var(--brand-soft) 0%, var(--brand-accent-soft) 42%, #ffffff 100%)",
      }}
    >
      <svg className="block w-full h-2 text-brand-soft" viewBox="0 0 1200 16" preserveAspectRatio="none" fill="currentColor">
        <path d="M0,16 C150,0 350,16 600,16 C850,16 1050,0 1200,16 L1200,0 L0,0 Z" />
      </svg>
      <div className="flex items-center justify-between px-4 pb-3 pt-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Zap size={18} fill="var(--brand-accent)" stroke="none" />
            <span className="text-base font-black text-brand-primary md:text-lg">
              Flash Sale
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[timeLeft.h, timeLeft.m, timeLeft.s].map((value, index) => (
              <span key={`${value}-${index}`} className="contents">
                <span
                  className="rounded bg-brand-primary px-1.5 py-0.5 font-mono text-xs font-black text-white shadow-sm"
                >
                  {pad(value)}
                </span>
                {index < 2 ? <span className="text-xs font-bold text-gray-400">:</span> : null}
              </span>
            ))}
          </div>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-0.5 text-xs font-bold text-brand-primary transition-opacity hover:opacity-70"
        >
          Lihat Semua <ChevronRight size={13} />
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto px-4 pb-5 [scrollbar-width:none]">
          {products.map((product, index) => {
            return (
              <div
                key={`${product.href}-${index}`}
                className="w-40 flex-shrink-0 overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg md:w-48"
              >
                <Link href={product.href} className="block">
                  <div className="relative h-36 w-full overflow-hidden bg-gray-50 md:h-40">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 160px, 192px"
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <FlashPlaceholder />
                    )}
                    <span
                      className="absolute left-2 top-2 rounded bg-brand-accent px-1.5 py-0.5 text-[10px] font-black text-brand-primary-dark shadow-sm"
                    >
                      {product.badge ?? "PROMO"}
                    </span>
                  </div>
                </Link>
                <div className="p-2.5">
                  <Link href={product.href}>
                    <p className="mb-1.5 line-clamp-2 text-xs font-semibold leading-tight text-gray-700">
                      {product.name}
                    </p>
                  </Link>
                  {product.flashSalePrice ? (
                    <>
                      <p className="text-sm font-black text-brand-accent">
                        {product.flashSalePrice}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400 line-through">
                        {product.showRetailAsPrimary && product.retailPrice
                          ? product.retailPrice
                          : product.publicPrice}
                      </p>
                    </>
                  ) : product.showRetailAsPrimary && product.retailPrice ? (
                    <>
                      <p className="text-sm font-black text-brand-primary">
                        {product.retailPrice}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400 line-through">
                        {product.publicPrice}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-black text-brand-primary">
                      {product.publicPrice}
                    </p>
                  )}
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(90, 42 + index * 8)}%`,
                        background:
                          "linear-gradient(to right, var(--brand-accent), var(--brand-primary))",
                      }}
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {product.stockText ?? "Cek stok"}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <Link
                      href={product.href}
                      className="rounded-full border border-brand-primary/20 bg-white px-2 py-1.5 text-center text-[10px] font-black text-brand-primary transition hover:bg-brand-primary hover:text-white"
                    >
                      Detail
                    </Link>
                    <WhatsAppInquiryButton
                      productId={product.productId}
                      productSlug={product.productSlug ?? undefined}
                      label="Tanya"
                      className="w-full rounded-full px-2 py-1.5 text-[10px]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 pb-5">
          <div className="rounded-xl border border-dashed border-brand-border bg-white/60 p-6 text-center">
            <Zap className="mx-auto mb-2 size-8 text-gray-300" />
            <p className="text-sm font-bold text-gray-400">Flash Sale Akan Segera Dimulai</p>
            <p className="mt-1 text-xs text-gray-300">Produk promo akan muncul di sini.</p>
          </div>
        </div>
      )}
    </section>
  );
}
