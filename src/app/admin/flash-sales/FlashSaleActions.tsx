"use client";

import { useActionState, useState } from "react";

import { deleteFlashSaleAction, toggleFlashSaleAction, type FlashSaleFormState } from "./actions";

const initialState: FlashSaleFormState = { success: false, message: "" };

export default function FlashSaleActions({ flashSaleId, isActive }: { flashSaleId: string; isActive: boolean }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [, toggleAction, togglePending] = useActionState(toggleFlashSaleAction, initialState);
  const [state, formAction, isPending] = useActionState(deleteFlashSaleAction, initialState);

  return (
    <>
      <form action={toggleAction}>
        <input type="hidden" name="id" value={flashSaleId} />
        <input type="hidden" name="action" value={isActive ? "deactivate" : "activate"} />
        <button
          type="submit"
          disabled={togglePending}
          className={`text-xs font-semibold hover:underline ${
            isActive ? "text-warning" : "text-success"
          }`}
        >
          {togglePending ? "..." : isActive ? "Nonaktifkan" : "Aktifkan"}
        </button>
      </form>

      <button
        onClick={() => setShowConfirm(true)}
        className="text-xs font-semibold text-danger hover:underline"
      >
        Hapus
      </button>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowConfirm(false)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-brand-text">Hapus Flash Sale</h3>
            <p className="mt-2 text-sm text-brand-muted">
              Yakin ingin menghapus flash sale ini?
              <br />Tindakan ini tidak dapat dibatalkan.
            </p>
            {state.error ? (
              <p className="mt-2 text-xs text-danger">{state.error}</p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-xl border border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
              >
                Batal
              </button>
              <form action={formAction}>
                <input type="hidden" name="id" value={flashSaleId} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {isPending ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
