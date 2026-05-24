import { BadgePercent, CalendarDays, TicketPercent } from "lucide-react";

import VoucherClaimButton from "@/components/ui/VoucherClaimButton";

type VoucherCardProps = {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountLabel: string;
  minimumPurchase?: string;
  audience: "PUBLIC" | "RETAIL";
  expiresAt: string;
  isActive: boolean;
  isExpired: boolean;
  isAuthenticated: boolean;
  isClaimed: boolean;
  canClaim: boolean;
  disabledReason?: string;
};

export default function VoucherCard({
  id,
  code,
  title,
  description,
  discountLabel,
  minimumPurchase,
  audience,
  expiresAt,
  isActive,
  isExpired,
  isAuthenticated,
  isClaimed,
  canClaim,
  disabledReason,
}: VoucherCardProps) {
  const audienceLabel = audience === "PUBLIC" ? "Umum" : "Ritel";
  const expiryText = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(expiresAt));
  const statusLabel = isClaimed
    ? "Sudah Diklaim"
    : isExpired
      ? "Expired"
      : isActive
        ? "Aktif"
        : "Tidak Berlaku";
  const statusClass = isClaimed
    ? "bg-soft-teal/15 text-primary-maroon"
    : isExpired || !isActive
      ? "bg-text-muted/10 text-text-muted"
      : "bg-success/15 text-success";

  return (
    <article className="relative overflow-hidden rounded-2xl border border-border-gray bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary-maroon/20 hover:shadow-md">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-br from-accent-rose/20 to-soft-teal/20" />
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-maroon text-white">
              <TicketPercent className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-text-muted">
                Voucher {audienceLabel}
              </p>
              <p className="text-xs font-black text-primary-maroon">
                {isClaimed ? code : "Klaim untuk lihat kode"}
              </p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-[11px] font-black ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <h3 className="mt-4 line-clamp-2 min-h-12 text-lg font-black leading-snug text-text-dark">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-text-muted">
            {description}
          </p>
        ) : null}

        <div className="mt-4 rounded-2xl border border-dashed border-accent-rose/30 bg-accent-rose/5 p-3">
          <div className="flex items-center gap-2">
            <BadgePercent className="size-5 text-accent-rose" />
            <span className="text-2xl font-black text-accent-rose">{discountLabel}</span>
          </div>
          {minimumPurchase ? (
            <p className="mt-1 text-xs font-semibold text-text-muted">
              Min. transaksi {minimumPurchase}
            </p>
          ) : (
            <p className="mt-1 text-xs font-semibold text-text-muted">
              Berlaku untuk inquiry produk yang sesuai.
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-text-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-4 text-primary-maroon" />
            Hingga {expiryText}
          </span>
          <span className="rounded-full bg-soft-bg px-2 py-1 font-black text-primary-maroon">
            {audienceLabel}
          </span>
        </div>

        <div className="mt-4">
          <VoucherClaimButton
            voucherId={id}
            isAuthenticated={isAuthenticated}
            isClaimed={isClaimed}
            canClaim={canClaim && isActive && !isExpired}
            disabledReason={disabledReason}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-maroon px-4 py-3 text-sm font-black text-white transition hover:bg-accent-rose disabled:cursor-not-allowed disabled:opacity-60"
            claimedClassName="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-soft-teal/15 px-4 py-3 text-sm font-black text-primary-maroon"
          />
        </div>
      </div>
    </article>
  );
}
