"use client";

import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export type HeroBannerData = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
};

type FigmaHeroCarouselProps = {
  banners: HeroBannerData[];
  storeName?: string;
};

function fallbackSlide(storeName: string): HeroBannerData {
  return {
    id: "fallback-catalog-hero",
    title: "Katalog Komputer dan Aksesoris Premium",
    subtitle: `${storeName} - cek stok dan konsultasi produk langsung via WhatsApp.`,
    imageUrl: null,
  };
}

export default function FigmaHeroCarousel({
  banners,
  storeName = "RAMA COMPUTER",
}: FigmaHeroCarouselProps) {
  const slides = banners.length > 0 ? banners : [fallbackSlide(storeName)];
  const [activeBanner, setActiveBanner] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const current = slides[activeBanner] ?? slides[0];
  const imageSrc = current?.imageUrl && !imageErrors.has(current.id) ? current.imageUrl : null;

  useEffect(() => {
    if (slides.length <= 1) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveBanner((previous) => (previous + 1) % slides.length);
    }, 6200);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative isolate overflow-hidden bg-[#0B1020] text-white">
      <div className="relative min-h-[520px] overflow-hidden sm:min-h-[600px] lg:min-h-[680px]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={current.title}
            fill
            priority={activeBanner === 0}
            sizes="100vw"
            className="object-contain object-center sm:object-cover"
            onError={() => setImageErrors((previous) => new Set(previous).add(current.id))}
          />
        ) : (
          <FallbackBackdrop />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,16,32,0.92)_0%,rgba(11,16,32,0.68)_42%,rgba(11,16,32,0.24)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent to-[#F6F7FB]" />

        <div className="relative z-10 mx-auto flex min-h-[520px] max-w-[1400px] items-center px-5 py-20 sm:min-h-[600px] sm:px-8 lg:min-h-[680px]">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.26em] text-[#E4D329] backdrop-blur">
              <span className="size-1.5 rounded-full bg-[#E4D329]" />
              {storeName}
            </p>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {current.title}
            </h1>
            {current.subtitle ? (
              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-white/85 sm:text-lg">
                {current.subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="absolute bottom-24 left-5 z-20 flex items-center gap-2 sm:left-8 lg:left-[calc((100vw-min(1400px,100vw))/2+2rem)]">
          {slides.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Pilih banner ${index + 1}`}
              onClick={() => setActiveBanner(index)}
              className="h-2 rounded-full transition-all"
              style={{
                width: activeBanner === index ? 34 : 9,
                backgroundColor: activeBanner === index ? "#E4D329" : "rgba(255,255,255,0.42)",
              }}
            />
          ))}
        </div>
      ) : null}

      {slides.length > 1 ? (
        <div className="absolute bottom-24 right-5 z-20 hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => setActiveBanner((previous) => (previous - 1 + slides.length) % slides.length)}
            className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:border-[#E4D329] hover:text-[#E4D329]"
            aria-label="Banner sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setActiveBanner((previous) => (previous + 1) % slides.length)}
            className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:border-[#E4D329] hover:text-[#E4D329]"
            aria-label="Banner berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function FallbackBackdrop() {
  return (
    <div className="absolute inset-0 bg-[#0B1020]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_34%,rgba(71,139,141,0.34),transparent_34%),linear-gradient(130deg,#0B1020_0%,#0D0B61_52%,#294669_100%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="absolute right-8 top-1/2 hidden w-[25rem] -translate-y-1/2 rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur lg:block">
        <Package className="size-12 text-[#E4D329]" strokeWidth={1.4} />
        <p className="mt-8 text-sm font-black uppercase tracking-[0.28em] text-white/65">
          Katalog Premium
        </p>
        <p className="mt-2 text-3xl font-black text-white">Cek stok via WhatsApp</p>
      </div>
    </div>
  );
}
