"use client";

import { ChevronRight, MessageCircle, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { isRenderablePromoBannerImageUrl } from "@/lib/promo-banner-url";

type PromoBannerData = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  ctaLabel: string | null;
};

type FigmaPromoBannerRowProps = {
  whatsappUrl: string;
  hasVoucher: boolean;
  banners: PromoBannerData[];
  enabled: boolean;
};

function isWhatsappUrl(value: string | null) {
  return value?.startsWith("wa.me") || value?.startsWith("https://wa.me") || value?.startsWith("https://api.whatsapp");
}

function BannerCard({
  banner,
  whatsappUrl,
  priority = false,
}: {
  banner: PromoBannerData;
  whatsappUrl: string;
  priority?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const href = banner.linkUrl || "/products";
  const ctaText = banner.ctaLabel || "Lihat";
  const showImage =
    banner.imageUrl && isRenderablePromoBannerImageUrl(banner.imageUrl) && !imageError;

  return (
    <Link
      href={isWhatsappUrl(banner.linkUrl) ? whatsappUrl : href}
      className="group relative overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-md"
      style={{ height: 140 }}
    >
      {showImage ? (
        <Image
          src={banner.imageUrl!}
          alt={banner.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className="size-full"
          style={{ background: "linear-gradient(135deg, #72BAA9 0%, #D5E7B5 100%)" }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to right, #6E1A37cc, transparent)" }}
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white md:left-5">
        <p className="text-base font-black md:text-lg">{banner.title}</p>
        {banner.subtitle ? (
          <p className="mt-0.5 line-clamp-1 max-w-[14rem] text-xs opacity-90 md:max-w-xs">
            {banner.subtitle}
          </p>
        ) : null}
        <p className="mt-0.5 flex items-center gap-1 text-xs opacity-90">
          {isWhatsappUrl(banner.linkUrl) ? (
            <>
              <MessageCircle size={12} />
              Tanya Admin
            </>
          ) : (
            <>
              {ctaText}
              <ChevronRight size={12} />
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

export default function FigmaPromoBannerRow({ whatsappUrl, hasVoucher, banners, enabled }: FigmaPromoBannerRowProps) {
  if (!enabled || banners.length === 0) return null;

  return (
    <>
      <section
        className="mt-2 flex items-center justify-between px-5 py-4 md:mx-4 md:mt-4 md:rounded-2xl shadow-sm"
        style={{ background: "linear-gradient(135deg, #72BAA9 0%, #D5E7B5 100%)" }}
      >
        <div className="flex items-start gap-3">
          <span className="hidden shrink-0 rounded-xl bg-white/30 p-2 md:block">
            <Sparkles className="size-5 text-[#6E1A37]" />
          </span>
          <div>
            <p className="text-sm font-black text-[#6E1A37]">
              {hasVoucher ? "Voucher katalog tersedia!" : "Promo katalog tersedia berkala"}
            </p>
            <p className="mt-0.5 text-xs text-[#6E1A37]/70">
              Klaim voucher, lalu lanjutkan konsultasi produk via WhatsApp.
            </p>
          </div>
        </div>
        <Link
          href="/vouchers"
          className="ml-4 flex-shrink-0 rounded-full px-4 py-2 text-xs font-black text-white shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95"
          style={{ backgroundColor: "#6E1A37" }}
        >
          Klaim Voucher
        </Link>
      </section>

      <section className="mt-2 flex flex-col gap-3 md:mx-4 md:mt-4 md:grid md:grid-cols-2 md:gap-4">
        {banners.slice(0, 2).map((banner, index) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            whatsappUrl={whatsappUrl}
            priority={index === 0}
          />
        ))}
      </section>
    </>
  );
}
