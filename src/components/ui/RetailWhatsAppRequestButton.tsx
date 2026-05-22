"use client";

import { useState } from "react";

export function RetailWhatsAppRequestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/retail/request-whatsapp", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal memproses permintaan.");
        return;
      }

      window.location.href = data.waUrl;
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleRequest}
        disabled={isLoading}
        className="w-full rounded-xl bg-whatsapp-green px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isLoading ? "Memproses..." : "Minta Token Retail via WhatsApp"}
      </button>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
