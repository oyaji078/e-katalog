"use client";

import { CheckCircle, LogIn, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type VoucherClaimButtonProps = {
  voucherId: string;
  isAuthenticated: boolean;
  isClaimed: boolean;
  canClaim: boolean;
  disabledReason?: string;
  className?: string;
  claimedClassName?: string;
  label?: string;
};

export default function VoucherClaimButton({
  voucherId,
  isAuthenticated,
  isClaimed,
  canClaim,
  disabledReason,
  className = "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-2 text-xs font-black text-brand-on-accent transition hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-60",
  claimedClassName = "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-support/15 px-4 py-2 text-xs font-black text-brand-on-light",
  label = "Klaim Voucher",
}: VoucherClaimButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(isClaimed);
  const [message, setMessage] = useState<string | null>(null);

  if (claimed) {
    return (
      <span className={claimedClassName}>
        <CheckCircle className="size-4 text-brand-secondary" />
        Sudah Diklaim
      </span>
    );
  }

  if (!canClaim && disabledReason) {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <button type="button" disabled className={className}>
          <TicketCheck className="size-4" />
          Tidak Berlaku
        </button>
        <span className="max-w-52 text-xs font-semibold text-danger">
          {disabledReason}
        </span>
      </span>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/login" className={className}>
        <LogIn className="size-4" />
        Login untuk Klaim
      </Link>
    );
  }

  const handleClaim = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/vouchers/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        if (response.status === 409) {
          setClaimed(true);
          router.refresh();
          return;
        }

        setMessage(payload?.message ?? "Voucher belum bisa diklaim.");
        return;
      }

      setClaimed(true);
      setMessage(payload?.message ?? "Voucher berhasil diklaim.");
      router.refresh();
    } catch {
      setMessage("Gagal klaim voucher. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClaim}
        disabled={!canClaim || loading}
        className={className}
      >
        <TicketCheck className="size-4" />
        {loading ? "Memproses..." : label}
      </button>
      {message || (!canClaim && disabledReason) ? (
        <span className="max-w-52 text-xs font-semibold text-danger">
          {message ?? disabledReason}
        </span>
      ) : null}
    </span>
  );
}
