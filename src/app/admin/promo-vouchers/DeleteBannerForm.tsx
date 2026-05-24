"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteBannerForm({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/promo-banners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Gagal menghapus banner");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={() => setConfirming(true)} className="rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger">
        Hapus
      </button>
      {confirming ? (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-border-gray bg-white p-4 text-left shadow-xl">
          <h3 className="text-sm font-bold text-text-dark">Hapus Banner?</h3>
          <p className="mt-2 text-xs leading-5 text-text-muted">Banner akan dihapus permanen.</p>
          {error ? <p className="mt-3 text-xs font-semibold text-danger">{error}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => { setConfirming(false); setError(""); }} disabled={loading}
              className="rounded-lg border border-border-gray px-3 py-1.5 text-xs font-semibold text-text-muted disabled:opacity-60">
              Batal
            </button>
            <button onClick={handleDelete} disabled={loading}
              className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
              {loading ? "..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
