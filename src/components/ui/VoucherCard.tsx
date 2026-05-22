type VoucherCardProps = {
  title: string;
  description?: string;
  discountLabel: string;
  minimumPurchase?: string;
  audience: "PUBLIC" | "RETAIL";
  isActive: boolean;
};

export default function VoucherCard({
  title,
  description,
  discountLabel,
  minimumPurchase,
  audience,
  isActive,
}: VoucherCardProps) {
  const audienceClass = audience === "PUBLIC" ? "border-accent-rose" : "border-soft-teal";
  const audienceLabel = audience === "PUBLIC" ? "Voucher Publik" : "Voucher Retail";
  const status = isActive ? "Aktif" : "Nonaktif";
  const statusClass = isActive ? "bg-success/20 text-success" : "bg-text-muted/10 text-text-muted";

  return (
    <article className={`rounded-lg border border-border-gray bg-white p-4 transition hover:shadow-md ${audienceClass}/20`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold">{audienceLabel}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass}`}>
          {status}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 line-clamp-2 text-sm text-text-muted">{description}</p>
      )}
      <div className="mt-3 space-x-2">
        <span className="font-bold text-accent-rose">{discountLabel}</span>
        {minimumPurchase && (
          <span className="text-xs text-text-muted">(Min. beli {minimumPurchase})</span>
        )}
      </div>
      {!isActive && (
        <p className="mt-2 text-xs italic text-text-muted">Voucher ini belum aktif</p>
      )}
    </article>
  );
}
