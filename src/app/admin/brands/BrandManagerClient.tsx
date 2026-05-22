"use client";

import { useActionState } from "react";
import type { Brand } from "@/generated/prisma/client";

import {
  createBrandAction,
  type BrandState,
  disableBrandAction,
  updateBrandAction,
} from "./actions";

const initialState: BrandState = { success: false, message: "", error: "" };

export default function BrandManagerClient({ brands }: { brands: Brand[] }) {
  const [createState, createAction, creating] = useActionState(createBrandAction, initialState);

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-border-gray bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Create Brand</h2>
        <form action={createAction} className="mt-4 grid gap-3 sm:grid-cols-4">
          <input name="name" placeholder="Name" required className="rounded-xl border border-border-gray px-3 py-2 text-sm" />
          <input name="slug" placeholder="Slug optional" className="rounded-xl border border-border-gray px-3 py-2 text-sm" />
          <input name="logoUrl" placeholder="Logo URL" className="rounded-xl border border-border-gray px-3 py-2 text-sm" />
          <input name="sortOrder" type="number" placeholder="Sort" className="rounded-xl border border-border-gray px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input name="isActive" type="checkbox" defaultChecked /> Active
          </label>
          <textarea name="description" placeholder="Description" className="rounded-xl border border-border-gray px-3 py-2 text-sm sm:col-span-4" />
          {createState.error ? <p className="text-sm text-danger sm:col-span-4">{createState.error}</p> : null}
          {createState.success ? <p className="text-sm text-success sm:col-span-4">{createState.message}</p> : null}
          <button disabled={creating} className="rounded-xl bg-primary-maroon px-4 py-2 text-sm font-bold text-white sm:col-span-4">
            {creating ? "Saving..." : "Create Brand"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-border-gray bg-white shadow-sm">
        <div className="border-b border-border-gray p-5">
          <h2 className="text-lg font-bold">Brands</h2>
        </div>
        <div className="divide-y divide-border-gray">
          {brands.map((brand) => (
            <BrandRow key={brand.id} brand={brand} />
          ))}
        </div>
      </section>
    </div>
  );
}

function BrandRow({ brand }: { brand: Brand }) {
  const [updateState, updateAction, updating] = useActionState(updateBrandAction, initialState);
  const [disableState, disableAction, disabling] = useActionState(disableBrandAction, initialState);

  return (
    <div className="grid gap-3 p-4">
      <form action={updateAction} className="grid gap-3 sm:grid-cols-6">
        <input type="hidden" name="id" value={brand.id} />
        <input name="name" defaultValue={brand.name} className="rounded-xl border border-border-gray px-3 py-2 text-sm" />
        <input name="slug" defaultValue={brand.slug} className="rounded-xl border border-border-gray px-3 py-2 text-sm" />
        <input name="logoUrl" defaultValue={brand.logoUrl ?? ""} className="rounded-xl border border-border-gray px-3 py-2 text-sm" />
        <input name="sortOrder" type="number" defaultValue={brand.sortOrder} className="rounded-xl border border-border-gray px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input name="isActive" type="checkbox" defaultChecked={brand.isActive} /> Active
        </label>
        <button disabled={updating} className="rounded-xl bg-primary-maroon px-3 py-2 text-sm font-bold text-white">
          Save
        </button>
        <textarea name="description" defaultValue={brand.description ?? ""} className="rounded-xl border border-border-gray px-3 py-2 text-sm sm:col-span-6" />
      </form>
      <form action={disableAction}>
        <input type="hidden" name="id" value={brand.id} />
        <button disabled={disabling} className="text-sm font-semibold text-danger">
          Disable
        </button>
      </form>
      {updateState.error || disableState.error ? <p className="text-sm text-danger">{updateState.error || disableState.error}</p> : null}
      {updateState.success || disableState.success ? <p className="text-sm text-success">{updateState.message || disableState.message}</p> : null}
    </div>
  );
}
