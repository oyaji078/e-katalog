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
  linkedVoucher?: {
    code: string;
    discountLabel: string;
    minimumLabel: string;
    audienceLabel: string;
    scheduleLabel: string;
  } | null;
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
  const isLinkedVoucher = Boolean(banner.linkedVoucher);
  const href = isLinkedVoucher ? "/vouchers" : banner.linkUrl || "/products";
  const ctaText = isLinkedVoucher ? "Klaim Voucher" : banner.ctaLabel || "Lihat";
  const showImage =
    banner.imageUrl && isRenderablePromoBannerImageUrl(banner.imageUrl) && !imageError;

  return (
      <Link
        href={isWhatsappUrl(banner.linkUrl) ? whatsappUrl : href}
        className="group relative overflow-hidden border border-[#2A2A38] bg-[#14161E] shadow-sm transition hover:border-[#E4D329]"
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
          <div className="size-full bg-[linear-gradient(135deg,#0D0B61,#294669)]" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(13,11,97,0.85), rgba(41,70,105,0.60), transparent)",
          }}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white md:left-5">
          <p className="text-base font-black md:text-lg">
            {banner.linkedVoucher ? `${banner.linkedVoucher.code} - ${banner.linkedVoucher.discountLabel}` : banner.title}
          </p>
          {banner.linkedVoucher ? (
            <p className="mt-0.5 line-clamp-2 max-w-[14rem] text-xs text-[#8A8A9E] md:max-w-xs">
              Min {banner.linkedVoucher.minimumLabel} | {banner.linkedVoucher.audienceLabel} | {banner.linkedVoucher.scheduleLabel}
            </p>
          ) : banner.subtitle ? (
            <p className="mt-0.5 line-clamp-1 max-w-[14rem] text-xs text-[#8A8A9E] md:max-w-xs">
              {banner.subtitle}
            </p>
          ) : null}
          <p className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#E4D329]">
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
      <section className="mt-6 flex min-w-0 items-center justify-between overflow-x-hidden border border-[#2A2A38] bg-[#14161E] px-5 py-4 shadow-sm md:mx-0">
        <div className="flex items-start gap-3">
          <span className="hidden shrink-0 border border-[#2A2A38] bg-[#1C1E26] p-2 md:block">
            <Sparkles className="size-5 text-[#E4D329]" />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#F0F0F5]">
              {hasVoucher ? "Voucher katalog tersedia!" : "Promo katalog tersedia berkala"}
            </p>
            <p className="mt-1 text-xs text-[#8A8A9E]">
              Klaim voucher, lalu lanjutkan konsultasi produk via WhatsApp.
            </p>
          </div>
        </div>
        <Link
          href="/vouchers"
          className="ml-4 flex-shrink-0 bg-[#E4D329] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#0D0B61] transition-colors hover:bg-[#D2BE25]"
        >
          Klaim Voucher
        </Link>
      </section>

      <section className="mt-3 flex flex-col gap-3 overflow-x-hidden md:grid md:grid-cols-2 md:gap-4">
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
