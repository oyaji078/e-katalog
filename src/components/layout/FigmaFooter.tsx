import { BadgePercent, MessageCircle } from "lucide-react";
import Link from "next/link";

const navigation = [
  { label: "Beranda", href: "/" },
  { label: "Produk", href: "/products" },
  { label: "Voucher", href: "/vouchers" },
  { label: "Daftar Ritel", href: "/register" },
];

const categories = [
  "Laptop",
  "PC Rakitan",
  "Monitor",
  "Printer",
  "Networking",
  "Aksesoris",
];

const support = [
  { label: "WhatsApp", href: "/products", icon: MessageCircle },
  { label: "Klaim Voucher", href: "/vouchers", icon: BadgePercent },
  { label: "Konsultasi Produk", href: "/products", icon: MessageCircle },
];

export default function FigmaFooter() {
  return (
    <footer className="mx-auto mt-8 max-w-7xl overflow-hidden px-4">
      <div
        className="grid gap-6 rounded-t-2xl px-5 py-6 text-white sm:px-8 sm:py-7 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.9fr]"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-primary-dark), var(--brand-primary))",
        }}
      >
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-block">
            <span className="text-xl font-black sm:text-2xl">
              E-<span className="text-brand-accent">Katalog</span>
            </span>
          </Link>
          <p className="mt-2 max-w-sm text-xs leading-6 text-white/70">
            E-Katalog Komputer & Aksesoris untuk laptop, PC rakitan, monitor, printer,
            networking, dan perangkat pendukung kerja maupun gaming.
          </p>
        </div>

        <FooterColumn title="Navigasi">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="text-xs text-white/80 transition-colors hover:text-white">
              {item.label}
            </Link>
          ))}
        </FooterColumn>

        <FooterColumn title="Kategori">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/products?q=${encodeURIComponent(category)}`}
              className="text-xs text-white/80 transition-colors hover:text-white"
            >
              {category}
            </Link>
          ))}
        </FooterColumn>

        <FooterColumn title="Dukungan">
          {support.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex items-center gap-2 text-xs text-white/80 transition-colors hover:text-white"
              >
                <Icon size={13} />
                {item.label}
              </Link>
            );
          })}
        </FooterColumn>
      </div>
      <div className="flex flex-col items-center justify-between gap-2 rounded-b-2xl bg-brand-primary-dark px-5 py-3 text-[11px] text-white/50 sm:flex-row sm:px-8">
        <span>(c) 2026 E-Katalog Komputer. All rights reserved.</span>
        <div className="flex gap-4">
          <Link href="/vouchers" className="transition-colors hover:text-white/80">
            Voucher
          </Link>
          <Link href="/products" className="transition-colors hover:text-white/80">
            Katalog
          </Link>
        </div>
      </div>
    </footer>
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
      <h2 className="mb-3 text-xs font-black uppercase tracking-wide text-brand-accent">
        {title}
      </h2>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}
