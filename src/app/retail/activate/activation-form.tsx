"use client";

import { useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";

import { activateRetailToken, type ActivationState } from "./actions";

const initialState: ActivationState = { status: "idle" };

export default function ActivationForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    activateRetailToken,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.push("/retail/activate/success");
    }
  }, [state.status, router]);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label className="text-sm font-semibold" htmlFor="token">
          Token Aktivasi
        </label>
        <input
          id="token"
          name="token"
          type="password"
          placeholder="Masukkan token aktivasi"
          required
          className="mt-2 w-full rounded-xl border border-border-gray px-3 py-3 text-sm outline-none focus:border-primary-maroon"
        />
      </div>

      {state.status === "error" ? (
        <p className="text-sm text-danger">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-primary-maroon px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Memverifikasi..." : "Aktifkan Retail"}
      </button>
    </form>
  );
}
