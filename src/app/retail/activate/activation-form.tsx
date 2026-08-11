"use client";

import { useEffect, useActionState } from "react";

import { activateRetailToken, type ActivationState } from "./actions";

const initialState: ActivationState = { status: "idle" };

export default function ActivationForm() {
  const [state, formAction, isPending] = useActionState(
    activateRetailToken,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      window.location.href = "/retail/activate/success";
    }
  }, [state.status]);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label className="text-sm font-semibold text-gray-900" htmlFor="token">
          Token Aktivasi
        </label>
        <input
          id="token"
          name="token"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          placeholder="Masukkan 6 digit OTP"
          required
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-gray-900 placeholder:text-slate-400 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>

      {state.status === "error" ? (
        <p className="text-sm text-danger">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Memverifikasi..." : "Aktifkan Retail"}
      </button>
    </form>
  );
}
