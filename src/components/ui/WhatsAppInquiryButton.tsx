"use client";

import { useCallback, useState } from "react";

type WhatsAppInquiryButtonProps = {
  productId: string;
  productSlug?: string;
  sourcePage?: string;
  label?: string;
  className?: string;
};

export default function WhatsAppInquiryButton({
  productId,
  productSlug,
  sourcePage = "catalog",
  label = "Tanya via WhatsApp",
  className = "",
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
          sourcePage,
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
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`rounded-md bg-whatsapp-green px-4 py-2 text-center text-xs font-bold text-white transition enabled:hover:bg-whatsapp-green/90 disabled:opacity-60 ${className}`}
      >
        {loading ? "Memproses..." : label}
      </button>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : null}
    </div>
  );
}
