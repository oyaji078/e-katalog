"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type HeroBannerData = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  ctaLabel: string | null;
};

type FigmaHeroCarouselProps = {
  banners: HeroBannerData[];
};

function isAbsoluteUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function FigmaHeroCarousel({ banners }: FigmaHeroCarouselProps) {
  const [activeBanner, setActiveBanner] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (banners.length === 0) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveBanner((previous) => (previous + 1) % banners.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-gray-200 md:mx-4 md:mt-4 md:rounded-2xl shadow-lg"
      style={{ height: "clamp(190px, 40vw, 380px)" }}
    >
      {banners.map((banner, index) => {
        const imageSrc =
          banner.imageUrl && !imageErrors.has(banner.id) ? banner.imageUrl : null;

        return (
          <div
            key={banner.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              opacity: activeBanner === index ? 1 : 0,
              zIndex: activeBanner === index ? 1 : 0,
            }}
          >
            {imageSrc ? (
              <div className="relative size-full">
                <Image
                  src={imageSrc}
                  alt={banner.title}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  onError={() => setImageErrors((prev) => new Set(prev).add(banner.id))}
                  priority={index === 0}
                />
              </div>
            ) : (
              <div
                className="size-full bg-gradient-to-br from-primary-maroon/20 via-primary-maroon/10 to-soft-teal/20"
              />
            )}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to right, #6E1A37f0 20%, #AE244888 60%, transparent 100%)",
              }}
            />
            <div className="absolute inset-0 shadow-inner pointer-events-none" />
            <div className="absolute left-4 top-1/2 max-w-[220px] -translate-y-1/2 text-white md:left-12 md:max-w-lg">
              {banner.subtitle ? (
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-85 md:mb-2 md:text-sm">
                  {banner.subtitle}
                </p>
              ) : null}
              <h1 className="mb-2 text-lg font-black leading-tight md:mb-4 md:text-4xl lg:text-5xl">
                {banner.title}
              </h1>
              {banner.ctaLabel && banner.linkUrl ? (
                <Link
                  href={isAbsoluteUrl(banner.linkUrl) ? banner.linkUrl : banner.linkUrl}
                  className="inline-flex rounded-full px-4 py-2 text-[11px] font-black shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 md:text-sm"
                  style={{ backgroundColor: "#D5E7B5", color: "#6E1A37" }}
                >
                  {banner.ctaLabel}
                </Link>
              ) : null}
            </div>
          </div>
        );
      })}

      {banners.length > 1 ? (
        <>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Pilih banner ${index + 1}`}
                onClick={() => setActiveBanner(index)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: activeBanner === index ? 22 : 6,
                  height: 6,
                  backgroundColor: activeBanner === index ? "#D5E7B5" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActiveBanner((previous) => (previous - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow transition-colors hover:bg-white md:flex"
            aria-label="Banner sebelumnya"
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => setActiveBanner((previous) => (previous + 1) % banners.length)}
            className="absolute right-3 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow transition-colors hover:bg-white md:flex"
            aria-label="Banner berikutnya"
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>
        </>
      ) : null}
    </section>
  );
}
