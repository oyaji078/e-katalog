"use client";

import { MessageCircle } from "lucide-react";
import { useCallback, useState, type CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

type WhatsAppInquiryButtonProps = {
  productId: string;
  productSlug?: string;
  sourcePage?: string;
  label?: string;
  size?: "normal" | "large";
  className?: string;
  buttonStyle?: CSSProperties;
  iconStyle?: CSSProperties;
};

export default function WhatsAppInquiryButton({
  productId,
  productSlug,
  sourcePage,
  label = "Tanya via WhatsApp",
  size = "normal",
  className = "",
  buttonStyle,
  iconStyle,
}: WhatsAppInquiryButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/inquiries/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          ...(productSlug ? { productSlug } : {}),
          ...(sourcePage ? { sourcePage } : {}),
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menghubungi WhatsApp");
      }

      const data = await res.json();

      if (!data.waUrl) {
        throw new Error("URL WhatsApp tidak ditemukan");
      }

      window.location.href = data.waUrl;
    } catch {
      setError("Gagal terhubung. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [productId, productSlug, sourcePage]);

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={twMerge(
          "inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-whatsapp-green px-3 py-2 text-center text-xs font-bold text-white shadow-[0_2px_8px_rgba(37,211,102,0.22)] transition enabled:hover:bg-whatsapp-green/90 disabled:opacity-60",
          size === "large" ? "gap-2 px-5 py-3 text-sm" : "",
          className,
        )}
        style={buttonStyle}
      >
        <MessageCircle className="size-3.5 shrink-0" style={iconStyle} />
        <span className="truncate">{loading ? "Memproses..." : label}</span>
      </button>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : null}
    </div>
  );
}
