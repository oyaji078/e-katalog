"use client";

import { useActionState } from "react";

import { toggleVoucherAction, type VoucherFormState } from "./actions";

const initialState: VoucherFormState = {
  success: false,
  message: "",
  error: "",
  voucherId: "",
};

export default function VoucherDisableFormClient({ voucherId }: { voucherId: string }) {
  const [state, formAction, isPending] = useActionState(toggleVoucherAction, initialState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="voucherId" value={voucherId} />
      <input type="hidden" name="action" value="deactivate" />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs font-bold text-danger disabled:opacity-60"
      >
        Nonaktifkan
      </button>
      {state.error ? <span className="ml-2 text-xs text-danger">{state.error}</span> : null}
    </form>
  );
}
