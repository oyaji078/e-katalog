import { Clock3, Flame, MessageCircle, Zap } from "lucide-react";
import Link from "next/link";

type FlashSaleProduct = {
  href: string;
  image?: string | null;
  name: string;
  publicPrice: string;
  badge?: string;
  stockText?: string;
};

type FlashSaleSectionProps = {
  products: FlashSaleProduct[];
};

const promoChips = [
  "Laptop kerja siap konsultasi",
  "PC rakitan gaming",
  "Printer kantor",
  "Networking & CCTV",
  "Aksesoris harian",
];

export default function FlashSaleSection({ products }: FlashSaleSectionProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-brand-accent/20 bg-white shadow-sm">
      <div className="flex flex-col gap-4 bg-gradient-to-r from-brand-primary to-brand-accent p-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-brand-accent shadow-sm">
            <Flame className="size-6" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brand-accent">
              Flash promo katalog
            </p>
            <h2 className="text-xl font-black leading-tight">Promo Cepat Minggu Ini</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black ring-1 ring-white/20">
          <Clock3 className="size-4 text-brand-accent" />
          <span>Visual promo, konfirmasi via WhatsApp</span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto p-4">
        {products.length > 0
          ? products.map((product) => (
              <Link
                key={product.href}
                href={product.href}
                className="group grid w-64 shrink-0 grid-cols-[86px_1fr] gap-3 rounded-2xl border border-brand-border bg-brand-bg p-3 transition hover:border-brand-primary hover:bg-white hover:shadow-sm"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary/10 to-brand-secondary/20">
                  {product.image ? (
                    <div
                      aria-label={product.name}
                      className="h-full w-full bg-cover bg-center transition group-hover:scale-105"
                      style={{ backgroundImage: `url("${product.image}")` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Zap className="size-8 text-brand-primary" />
                    </div>
                  )}
                  {product.badge ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-black text-white">
                      {product.badge}
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 min-h-9 text-sm font-black leading-tight text-brand-text">
                    {product.name}
                  </p>
                  <p className="mt-1 text-base font-black text-brand-accent">
                    {product.publicPrice}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-brand-muted">
                    {product.stockText ?? "Cek ketersediaan"}
                  </p>
                </div>
              </Link>
            ))
          : promoChips.map((chip) => (
              <div
                key={chip}
                className="flex w-56 shrink-0 items-center gap-3 rounded-2xl border border-brand-border bg-brand-bg p-4"
              >
                <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-primary text-white">
                  <MessageCircle className="size-5" />
                </span>
                <p className="text-sm font-black text-brand-text">{chip}</p>
              </div>
            ))}
      </div>
    </section>
  );
}
