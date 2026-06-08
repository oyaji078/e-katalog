"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteProductAction } from "./actions";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setIsLoading(true);
    setError("");

    try {
      const result = await deleteProductAction(productId);

      if (!result.success) {
        setError(result.error || "Produk gagal dihapus.");
        return;
      }

      setIsConfirming(false);
      router.refresh();
    } catch {
      setError("Produk gagal dihapus. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          setError("");
          setIsConfirming(true);
        }}
        className="rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger hover:text-white"
      >
        Hapus
      </button>

      {isConfirming ? (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-brand-light bg-brand-soft-white p-4 text-left text-brand-on-light shadow-xl">
          <h3 className="text-sm font-bold text-brand-on-light">Hapus Produk?</h3>
          <p className="mt-2 text-xs leading-5 text-brand-muted-on-light">
            Produk akan dihapus permanen dari database dan tidak tampil lagi di halaman public.
          </p>

          {error ? <p className="mt-3 text-xs font-semibold text-danger">{error}</p> : null}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsConfirming(false);
                setError("");
              }}
              disabled={isLoading}
              className="rounded-lg border border-brand-light px-3 py-1.5 text-xs font-semibold text-brand-muted-on-light hover:bg-[rgba(13,11,97,0.08)] disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Memproses..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
