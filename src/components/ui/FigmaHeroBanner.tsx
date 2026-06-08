import {
  BadgePercent,
  Cpu,
  Headphones,
  Laptop,
  MessageCircle,
  Monitor,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

type FigmaHeroBannerProps = {
  whatsappUrl: string;
  productCount: number;
  voucherCount: number;
};

export default function FigmaHeroBanner({
  whatsappUrl,
  productCount,
  voucherCount,
}: FigmaHeroBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-primary-dark via-brand-primary to-brand-secondary text-white shadow-xl">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_35%,rgba(200,169,30,0.24),transparent_32%),radial-gradient(circle_at_45%_70%,rgba(255,255,255,0.18),transparent_28%)] lg:block" />
      <div className="relative grid min-h-[360px] gap-8 p-6 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white ring-1 ring-white/20">
            <Sparkles className="size-4 text-brand-secondary" />
            E-katalog elektronik
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-5xl">
            Upgrade Perangkat Kerja & Gaming Anda
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">
            Temukan laptop, PC rakitan, monitor, printer, networking, dan aksesoris elektronik
            dengan harga umum dan harga ritel.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-brand-primary shadow-sm transition hover:bg-brand-soft"
            >
              Lihat Produk
            </Link>
            <a
              href={whatsappUrl}
              className="inline-flex items-center gap-2 rounded-2xl bg-whatsapp-green px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-whatsapp-green/90"
            >
              <MessageCircle className="size-4" />
              Tanya via WhatsApp
            </a>
            <Link
              href="/vouchers"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
            >
              <BadgePercent className="size-4" />
              Klaim Voucher
            </Link>
          </div>
        </div>

        <div className="relative min-h-[310px]">
          <div className="absolute inset-0 rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-sm" />
          <div className="absolute left-6 top-6 w-56 rounded-3xl bg-white p-4 text-brand-primary shadow-2xl sm:w-64">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-brand-muted">
                  Laptop & PC
                </p>
                <p className="mt-1 text-2xl font-black">Siap Inquiry</p>
              </div>
              <Laptop className="size-10 text-brand-secondary" />
            </div>
            <div className="mt-4 h-24 rounded-2xl bg-gradient-to-br from-brand-primary/10 to-brand-secondary/30" />
          </div>

          <div className="absolute bottom-7 right-4 w-56 rounded-3xl bg-white p-4 text-brand-primary shadow-2xl sm:right-8 sm:w-64">
            <div className="grid grid-cols-3 gap-2 text-center">
              <StatTile icon={Monitor} label="Produk" value={`${productCount}+`} />
              <StatTile icon={BadgePercent} label="Voucher" value={`${voucherCount}`} />
              <StatTile icon={Headphones} label="WA" value="Fast" />
            </div>
          </div>

          <div className="absolute right-7 top-14 hidden size-24 rotate-6 items-center justify-center rounded-[1.75rem] bg-brand-secondary text-brand-primary shadow-2xl sm:flex">
            <Cpu className="size-12" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-brand-bg p-2">
      <Icon className="mx-auto size-5 text-brand-accent" />
      <p className="mt-1 text-sm font-black">{value}</p>
      <p className="text-[10px] font-bold text-brand-muted">{label}</p>
    </div>
  );
}
