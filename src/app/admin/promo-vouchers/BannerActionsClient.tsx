"use client";

import { useState } from "react";
import { toggleBannerAction, deletePromoBannerAction } from "../promo-banners/actions";

export default function BannerActionsClient({ id, isActive }: { id: string; isActive: boolean }) {
  const [showDelete, setShowDelete] = useState(false);
  const [deleteState, setDeleteState] = useState<{ success: boolean; error: string } | null>(null);
  const [toggling, setToggling] = useState(false);

  async function handleToggle(action: string) {
    setToggling(true);
    try {
      const formData = new FormData();
      formData.set("action", action);
      const result = await toggleBannerAction(id, formData);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || "Gagal.");
      }
    } catch {
      alert("Gagal.");
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setToggling(true);
    try {
      const result = await deletePromoBannerAction(id);
      setDeleteState(result);
      if (result.success) {
        setTimeout(() => window.location.reload(), 500);
      }
    } catch {
      setDeleteState({ success: false, error: "Gagal menghapus banner." });
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/admin/promo-banners/${id}/edit`}
        className="rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-bold text-brand-on-accent hover:bg-brand-accent-hover"
      >
        Edit
      </a>

      <button
        type="button"
        disabled={toggling}
        onClick={() => handleToggle(isActive ? "deactivate" : "activate")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
          isActive
            ? "bg-warning/15 text-brand-on-light hover:bg-warning hover:text-brand-on-light"
            : "bg-success/15 text-success hover:bg-success hover:text-white"
        }`}
      >
        {toggling ? "..." : isActive ? "Nonaktifkan" : "Aktifkan"}
      </button>

      <button
        type="button"
        onClick={() => setShowDelete(true)}
        className="rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger hover:text-white"
      >
        Hapus
      </button>

      {showDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDelete(false)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-brand-light bg-brand-soft-white p-6 text-brand-on-light shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-brand-on-light">Hapus Promo/Voucher?</h3>
            {deleteState?.error ? (
              <p className="mt-3 rounded-lg bg-danger/5 p-3 text-xs text-danger">{deleteState.error}</p>
            ) : null}
            {deleteState?.success ? (
              <p className="mt-3 text-center text-sm text-success">Banner berhasil dihapus.</p>
            ) : (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowDelete(false)}
                  className="rounded-xl border border-brand-light px-4 py-2 text-xs font-semibold text-brand-muted-on-light hover:bg-[rgba(13,11,97,0.08)] hover:text-brand-on-light"
                >
                  Tidak
                </button>
                <button
                  type="button"
                  disabled={toggling}
                  onClick={handleDelete}
                  className="rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {toggling ? "..." : "Ya, Hapus"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
