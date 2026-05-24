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
    <section className="overflow-hidden rounded-3xl border border-accent-rose/20 bg-white shadow-sm">
      <div className="flex flex-col gap-4 bg-gradient-to-r from-primary-maroon to-accent-rose p-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-accent-rose shadow-sm">
            <Flame className="size-6" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-soft-teal">
              Flash promo katalog
            </p>
            <h2 className="text-xl font-black leading-tight">Promo Cepat Minggu Ini</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black ring-1 ring-white/20">
          <Clock3 className="size-4 text-soft-teal" />
          <span>Visual promo, konfirmasi via WhatsApp</span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto p-4">
        {products.length > 0
          ? products.map((product) => (
              <Link
                key={product.href}
                href={product.href}
                className="group grid w-64 shrink-0 grid-cols-[86px_1fr] gap-3 rounded-2xl border border-border-gray bg-soft-bg p-3 transition hover:border-primary-maroon hover:bg-white hover:shadow-sm"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-primary-maroon/10 to-soft-teal/20">
                  {product.image ? (
                    <div
                      aria-label={product.name}
                      className="h-full w-full bg-cover bg-center transition group-hover:scale-105"
                      style={{ backgroundImage: `url("${product.image}")` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Zap className="size-8 text-primary-maroon" />
                    </div>
                  )}
                  {product.badge ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-accent-rose px-2 py-0.5 text-[10px] font-black text-white">
                      {product.badge}
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 min-h-9 text-sm font-black leading-tight text-text-dark">
                    {product.name}
                  </p>
                  <p className="mt-1 text-base font-black text-accent-rose">
                    {product.publicPrice}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-text-muted">
                    {product.stockText ?? "Cek ketersediaan"}
                  </p>
                </div>
              </Link>
            ))
          : promoChips.map((chip) => (
              <div
                key={chip}
                className="flex w-56 shrink-0 items-center gap-3 rounded-2xl border border-border-gray bg-soft-bg p-4"
              >
                <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-maroon text-white">
                  <MessageCircle className="size-5" />
                </span>
                <p className="text-sm font-black text-text-dark">{chip}</p>
              </div>
            ))}
      </div>
    </section>
  );
}
