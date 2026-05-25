"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteHeroBannerAction } from "./actions";

export default function DeleteHeroBannerButton({ id }: { id: string }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setIsLoading(true);
    setError("");

    try {
      const result = await deleteHeroBannerAction(id);

      if (!result.success) {
        setError(result.error || "Hero banner gagal dihapus.");
        return;
      }

      setIsConfirming(false);
      router.refresh();
    } catch {
      setError("Hero banner gagal dihapus. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setError("");
          setIsConfirming(true);
        }}
        className="rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger"
      >
        Hapus
      </button>

      {isConfirming ? (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-brand-border bg-white p-4 text-left shadow-xl">
          <h3 className="text-sm font-bold text-brand-text">Hapus Hero Banner?</h3>
          <p className="mt-2 text-xs leading-5 text-brand-muted">
            Hero banner akan dihapus dan tidak tampil lagi di halaman utama.
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
              className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted disabled:opacity-60"
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
