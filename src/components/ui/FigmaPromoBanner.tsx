import { BadgePercent, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";

type FigmaPromoBannerProps = {
  hasVoucher: boolean;
  isClaimed?: boolean;
  claimSlot?: React.ReactNode;
};

export default function FigmaPromoBanner({
  hasVoucher,
  isClaimed = false,
  claimSlot,
}: FigmaPromoBannerProps) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-soft-teal/40 bg-gradient-to-br from-soft-teal/35 via-white to-accent-rose/10 shadow-sm">
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-3xl bg-primary-maroon text-white shadow-sm">
            <BadgePercent className="size-7" />
          </span>
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-accent-rose">
              <Sparkles className="size-4" />
              Promo voucher katalog
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-primary-maroon">
              {hasVoucher ? "Voucher tersedia untuk inquiry WhatsApp" : "Voucher katalog segera tersedia"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              {hasVoucher
                ? "Klaim promo katalog sebelum bertanya ke admin. Detail lengkap hanya ditampilkan di halaman voucher."
                : "Admin dapat menerbitkan voucher publik atau ritel untuk ditambahkan ke pesan WhatsApp."}
            </p>
            <p className="mt-3 text-xs font-black uppercase tracking-wide text-primary-maroon">
              {isClaimed ? "Voucher sudah diklaim" : "Promo terbatas, tanpa transaksi otomatis"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {claimSlot}
          <Link
            href="/vouchers"
            className="inline-flex items-center justify-center rounded-xl border border-primary-maroon/20 bg-white px-5 py-3 text-sm font-black text-primary-maroon transition hover:border-primary-maroon"
          >
            Lihat Voucher
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl bg-whatsapp-green px-5 py-3 text-sm font-black text-white transition hover:bg-whatsapp-green/90"
          >
            <MessageCircle className="size-4" />
            Tanya Produk
          </Link>
        </div>
      </div>
    </section>
  );
}
