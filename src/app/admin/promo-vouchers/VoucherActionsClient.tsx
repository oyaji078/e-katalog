"use client";

import { useActionState, useState } from "react";
import { toggleVoucherAction, deleteVoucherAction, type VoucherFormState } from "../vouchers/actions";

const initState: VoucherFormState = { success: false, message: "", error: "", voucherId: "" };

export default function VoucherActionsClient({ voucherId, isActive }: { voucherId: string; isActive: boolean }) {
  const [, toggleAction, togglePending] = useActionState(toggleVoucherAction, initState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteVoucherAction, initState);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <a
        href={`/admin/vouchers/${voucherId}/edit`}
        className="rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-bold text-brand-on-accent hover:bg-brand-accent-hover"
      >
        Edit
      </a>

      <form action={toggleAction}>
        <input type="hidden" name="voucherId" value={voucherId} />
        <input type="hidden" name="action" value={isActive ? "deactivate" : "activate"} />
        <button
          type="submit"
          disabled={togglePending}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            isActive
              ? "bg-warning/15 text-brand-on-light hover:bg-warning hover:text-brand-on-light"
              : "bg-success/15 text-success hover:bg-success hover:text-white"
          }`}
        >
          {togglePending ? "..." : isActive ? "Nonaktifkan" : "Aktifkan"}
        </button>
      </form>

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
            {deleteState.error ? (
              <p className="mt-3 rounded-lg bg-danger/5 p-3 text-xs text-danger">{deleteState.error}</p>
            ) : null}
            {deleteState.success ? (
              <p className="mt-3 text-center text-sm text-success">{deleteState.message}</p>
            ) : (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowDelete(false)}
                  className="rounded-xl border border-brand-light px-4 py-2 text-xs font-semibold text-brand-muted-on-light hover:bg-[rgba(13,11,97,0.08)] hover:text-brand-on-light"
                >
                  Tidak
                </button>
                <form action={deleteAction}>
                  <input type="hidden" name="voucherId" value={voucherId} />
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {deletePending ? "..." : "Ya, Hapus"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
