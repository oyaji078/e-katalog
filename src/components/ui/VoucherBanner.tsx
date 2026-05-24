import { BadgePercent, CalendarDays, Sparkles } from "lucide-react";
import Link from "next/link";

import VoucherClaimButton from "@/components/ui/VoucherClaimButton";

type VoucherBannerProps = {
  voucherId?: string;
  code?: string;
  title: string;
  subtitle?: string;
  discountLabel: string;
  audience: "PUBLIC" | "RETAIL";
  expiresAt: string;
  minimumPurchase?: string;
  isAuthenticated?: boolean;
  isClaimed?: boolean;
  canClaim?: boolean;
  isExpired?: boolean;
  disabledReason?: string;
  showDetails?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
};

export default function VoucherBanner({
  voucherId,
  code,
  title,
  subtitle,
  discountLabel,
  audience,
  expiresAt,
  minimumPurchase,
  isAuthenticated = false,
  isClaimed = false,
  canClaim = true,
  isExpired = false,
  disabledReason: disabledReasonProp,
  showDetails = true,
  ctaLabel = "Klaim Voucher",
  ctaHref = "/vouchers",
}: VoucherBannerProps) {
  const audienceLabel = audience === "PUBLIC" ? "Umum" : "Ritel";
  const expiryText = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(expiresAt));
  const disabledReason =
    disabledReasonProp ??
    (isExpired
      ? "Voucher sudah berakhir."
      : audience === "RETAIL"
        ? "Voucher ini khusus akun ritel aktif."
        : undefined);

  return (
    <section className="overflow-hidden rounded-2xl border border-soft-teal/40 bg-gradient-to-br from-soft-teal/30 via-white to-accent-rose/10 shadow-sm">
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center lg:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-rose px-3 py-1 text-xs font-black text-white">
              <BadgePercent className="size-4" />
              {discountLabel}
            </span>
            <span className="rounded-full bg-primary-maroon/10 px-3 py-1 text-xs font-black text-primary-maroon">
              {audienceLabel}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-primary-maroon shadow-sm">
              {isClaimed ? "Sudah Diklaim" : isExpired ? "Expired" : "Promo Aktif"}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primary-maroon">
                <Sparkles className="size-4 text-accent-rose" />
                Voucher katalog
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-primary-maroon md:text-3xl">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{subtitle}</p>
              ) : null}
              {showDetails ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-4 text-primary-maroon" />
                    Berlaku hingga {expiryText}
                  </span>
                  {minimumPurchase ? <span>Min. transaksi {minimumPurchase}</span> : null}
                </div>
              ) : (
                <p className="mt-3 text-xs font-black uppercase tracking-wide text-accent-rose">
                  Promo terbatas untuk inquiry katalog
                </p>
              )}
            </div>

            {showDetails && code ? (
              <div className="rounded-2xl border border-dashed border-primary-maroon/30 bg-white px-4 py-3 text-center shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-wide text-text-muted">
                  Kode voucher
                </p>
                <p className="mt-1 text-xl font-black tracking-wide text-primary-maroon">{code}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {voucherId ? (
            <VoucherClaimButton
              voucherId={voucherId}
              isAuthenticated={isAuthenticated}
              isClaimed={isClaimed}
              canClaim={canClaim && !isExpired}
              disabledReason={disabledReason}
              label={ctaLabel}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-maroon px-5 py-3 text-sm font-black text-white transition hover:bg-accent-rose disabled:cursor-not-allowed disabled:opacity-60"
            />
          ) : (
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-xl bg-primary-maroon px-5 py-3 text-sm font-black text-white transition hover:bg-accent-rose"
            >
              {ctaLabel}
            </Link>
          )}
          <Link
            href="/vouchers"
            className="inline-flex items-center justify-center rounded-xl border border-primary-maroon/20 bg-white px-5 py-3 text-sm font-black text-primary-maroon transition hover:border-primary-maroon"
          >
            Lihat Voucher
          </Link>
        </div>
      </div>
    </section>
  );
}
