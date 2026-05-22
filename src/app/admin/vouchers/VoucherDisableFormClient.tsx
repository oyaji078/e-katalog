"use client";

import { useActionState } from "react";

import { disableVoucherAction, type VoucherFormState } from "./actions";

const initialState: VoucherFormState = {
  success: false,
  message: "",
  error: "",
  voucherId: "",
};

export default function VoucherDisableFormClient({ voucherId }: { voucherId: string }) {
  const [state, formAction, isPending] = useActionState(disableVoucherAction, initialState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="voucherId" value={voucherId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs font-bold text-danger disabled:opacity-60"
      >
        Disable
      </button>
      {state.error ? <span className="ml-2 text-xs text-danger">{state.error}</span> : null}
    </form>
  );
}
