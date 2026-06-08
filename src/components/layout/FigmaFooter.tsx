import {
  BadgePercent,
  Clock,
  Laptop,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";

import { getDb } from "@/lib/db";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { buildWhatsappUrl } from "@/lib/whatsapp";

const fallbackCategories = ["Laptop", "Komputer", "Aksesoris", "Printer", "Monitor"];

async function getFooterCategories() {
  try {
    const db = getDb();
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, slug: true },
      take: 6,
    });

    if (categories.length > 0) return categories;
  } catch {
    // Static fallback keeps the footer useful if the database is unavailable.
  }

  return fallbackCategories.map((name) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
  }));
}

export default async function FigmaFooter() {
  const [settings, categories] = await Promise.all([
    getPublicSiteSettings(),
    getFooterCategories(),
  ]);
  const whatsappUrl = buildWhatsappUrl({
    whatsappNumber: settings.whatsappNumber,
    message: "Halo Admin, saya ingin konsultasi produk dari katalog.",
  });
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-12 border-t border-white/10 bg-[#0D0B61] text-[#F8FAFC]"
      style={{ "--public-accent": settings.accentColor } as CSSProperties}
    >
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-4 px-4 py-7 md:grid-cols-4 md:px-6">
          <Feature icon={MessageCircle} title="Konsultasi WA" desc="Tanya stok dan rekomendasi" />
          <Feature icon={Laptop} title="Produk IT" desc="Laptop, PC, printer, aksesori" />
          <Feature icon={BadgePercent} title="Promo Katalog" desc="Voucher jika tersedia" />
          <Feature icon={ShieldCheck} title="Harga Ritel" desc="Untuk pelanggan terdaftar" />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-12 sm:grid-cols-2 md:px-6 lg:grid-cols-[1.25fr_0.7fr_0.75fr_0.75fr_1.1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex min-w-0 items-center gap-3">
            {settings.logoUrl ? (
              <Image
                src={settings.logoUrl}
                alt={settings.storeName}
                width={40}
                height={40}
                className="size-10 bg-white object-contain p-1.5"
              />
            ) : (
              <span className="flex size-9 rotate-45 items-center justify-center bg-[var(--public-accent)]">
                <span className="-rotate-45 text-xs font-black text-brand-accent-text">
                  {settings.storeName.charAt(0).toUpperCase()}
                </span>
              </span>
            )}
              <span className="truncate text-sm font-black uppercase tracking-[0.2em] text-[#F8FAFC]">
                {settings.storeName}
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-xs leading-6 text-[#8A8A9E]">
              {settings.footerDescription}
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 bg-[#E4D329] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#0D0B61] transition-opacity hover:opacity-90"
            >
            <MessageCircle size={14} />
            Hubungi Admin
          </a>
        </div>

        <FooterColumn title="Produk">
          <Link href="/products">Katalog</Link>
          {categories.slice(0, 5).map((category) => (
            <Link key={category.slug} href={`/products?category=${encodeURIComponent(category.slug)}`}>
              {category.name}
            </Link>
          ))}
        </FooterColumn>

        <FooterColumn title="Informasi">
          <Link href="/">Tentang Toko</Link>
          <Link href="/products">Cara Cek Stok</Link>
          <Link href="/vouchers">Promo</Link>
          <Link href="/register">Ritel</Link>
        </FooterColumn>

        <FooterColumn title="Bantuan">
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            Hubungi Admin
          </a>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          {settings.googleMapsUrl ? (
            <a href={settings.googleMapsUrl} target="_blank" rel="noreferrer">
              Lokasi Toko
            </a>
          ) : (
            <Link href="/products">Lokasi Toko</Link>
          )}
          <Link href="/products">FAQ</Link>
        </FooterColumn>

        <FooterColumn title="Kontak">
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
            <MessageCircle size={13} />
            WhatsApp
          </a>
          {settings.email ? (
            <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2">
              <Mail size={13} />
              {settings.email}
            </a>
          ) : null}
          {settings.address ? (
            <p className="inline-flex items-start gap-2 text-xs leading-5 text-brand-muted">
              <MapPin size={13} className="mt-0.5 shrink-0 text-[var(--public-accent)]" />
              {settings.address}
            </p>
          ) : null}
          {settings.businessHours ? (
            <p className="inline-flex items-center gap-2 text-xs text-brand-muted">
              <Clock size={13} className="text-[var(--public-accent)]" />
              {settings.businessHours}
            </p>
          ) : null}
          {settings.googleMapsUrl ? (
            <a href={settings.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
              <MapPin size={13} />
              Buka Maps
            </a>
          ) : null}
        </FooterColumn>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-4 py-5 text-[10px] uppercase tracking-[0.24em] text-[#8A8A9E] sm:flex-row md:px-6">
          <span>(c) {year} {settings.siteName}. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="/vouchers" className="transition-colors hover:text-[#E4D329]">
              Voucher
            </Link>
            <Link href="/products" className="transition-colors hover:text-[#E4D329]">
              Katalog
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="group flex min-w-0 items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center border border-white/20 transition-colors group-hover:border-[#E4D329]">
        <Icon size={16} className="text-[#8A8A9E] transition-colors group-hover:text-[#E4D329]" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-[#F8FAFC]">{title}</p>
        <p className="mt-0.5 truncate text-[10px] text-[#8A8A9E]">{desc}</p>
      </div>
    </div>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-[#F8FAFC]">
        {title}
      </h2>
      <div className="grid gap-2.5 text-xs text-[#8A8A9E] [&_a]:transition-colors [&_a:hover]:text-[#E4D329]">
        {children}
      </div>
    </div>
  );
}



