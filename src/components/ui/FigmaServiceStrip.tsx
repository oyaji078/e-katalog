import { BadgePercent, MessageCircle, Package, ShieldCheck, Store } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    label: "Garansi Toko",
    sub: "Produk bergaransi",
    color: "var(--brand-secondary)",
  },
  {
    icon: MessageCircle,
    label: "Cek Stok via WhatsApp",
    sub: "Konfirmasi cepat",
    color: "var(--brand-primary)",
  },
  {
    icon: Store,
    label: "Harga Ritel Aktif",
    sub: "Token retail",
    color: "var(--brand-primary-dark)",
  },
  {
    icon: BadgePercent,
    label: "Voucher Katalog",
    sub: "Klaim promo",
    color: "var(--brand-accent)",
  },
  {
    icon: Package,
    label: "Konsultasi Produk",
    sub: "Sesuai kebutuhan",
    color: "var(--brand-hover)",
  },
];

export default function FigmaServiceStrip() {
  return (
    <section className="mt-2 grid grid-cols-2 gap-px overflow-hidden bg-gray-200 md:mx-4 md:mt-4 md:grid-cols-5 md:rounded-xl">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className="flex items-center gap-3 bg-white px-3 py-3">
            <div
              className="flex size-8 flex-shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: item.color }}
            >
              <Icon size={15} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">{item.label}</p>
              <p className="text-[10px] text-gray-400">{item.sub}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
