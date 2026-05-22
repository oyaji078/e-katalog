"use client";

import { useActionState } from "react";

import { archiveProductAction, type ProductFormState } from "./actions";

const initialState: ProductFormState = {
  success: false,
  message: "",
  error: "",
  productId: "",
};

export default function ProductArchiveFormClient({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(archiveProductAction, initialState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs font-medium text-danger hover:text-danger/80 disabled:opacity-60"
      >
        Archive
      </button>
      {state.error ? <span className="ml-2 text-xs text-danger">{state.error}</span> : null}
    </form>
  );
}
