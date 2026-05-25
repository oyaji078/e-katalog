"use client";

import { useActionState, useCallback, useMemo, useState } from "react";
import type { VoucherScope } from "@/generated/prisma/client";

import {
  createVoucherAction,
  type VoucherFormState,
  updateVoucherAction,
} from "./actions";

export type VoucherFormValue = {
  id: string;
  code: string;
  title: string;
  description: string;
  showForPublic: boolean;
  showForRetail: boolean;
  discountValue: string;
  minimumPurchase: string;
  startsAt: string;
  endsAt: string;
  usageQuota: string;
  scope: VoucherScope;
  productIds: string[];
  categoryIds: string[];
};

type VoucherFormClientProps = {
  mode: "create" | "edit";
  products: Array<{ id: string; label: string }>;
  categories: Array<{ id: string; label: string }>;
  voucher?: VoucherFormValue;
};

const initialState: VoucherFormState = {
  success: false,
  message: "",
  error: "",
  voucherId: "",
};

const scopeOptions: Array<{ value: VoucherScope; label: string }> = [
  { value: "ALL", label: "Semua Produk" },
  { value: "PRODUCTS", label: "Produk Tertentu" },
  { value: "CATEGORIES", label: "Kategori Tertentu" },
];

function formatPrice(val: string) {
  const num = val.replace(/[^0-9]/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("id-ID");
}

function parsePrice(val: string) {
  return val.replace(/\./g, "");
}

export default function VoucherFormClient({
  mode,
  products,
  categories,
  voucher,
}: VoucherFormClientProps) {
  const action = mode === "create" ? createVoucherAction : updateVoucherAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const isEdit = mode === "edit";

  const [showForPublic, setShowForPublic] = useState(
    voucher?.showForPublic ?? true,
  );
  const [showForRetail, setShowForRetail] = useState(
    voucher?.showForRetail ?? false,
  );

  const [scope, setScope] = useState<VoucherScope>(voucher?.scope ?? "ALL");

  const [discountDisplay, setDiscountDisplay] = useState(
    voucher ? formatPrice(voucher.discountValue) : "",
  );
  const [minimumDisplay, setMinimumDisplay] = useState(
    voucher?.minimumPurchase ? formatPrice(voucher.minimumPurchase) : "",
  );

  const handlePriceInput = useCallback(
    (setter: (v: string) => void) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        setter(raw);
      },
    [],
  );

  const discountRaw = useMemo(() => parsePrice(discountDisplay), [discountDisplay]);
  const minimumRaw = useMemo(() => parsePrice(minimumDisplay), [minimumDisplay]);

  return (
    <form action={formAction} className="grid gap-5">
      {voucher ? <input type="hidden" name="voucherId" value={voucher.id} /> : null}
      <input type="hidden" name="discountValue" value={discountRaw} />
      <input type="hidden" name="minimumPurchase" value={minimumRaw} />
      <input type="hidden" name="discountType" value="FIXED_AMOUNT" />

      {state.error ? (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-lg border border-success/20 bg-success/5 p-4 text-sm font-semibold text-success">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Judul Voucher" name="title" required defaultValue={voucher?.title} />

        {isEdit ? (
          <div>
            <label className="block text-sm font-semibold">Kode Voucher</label>
            <p className="mt-2 rounded-md border border-brand-border bg-gray-100 px-4 py-3 text-sm text-brand-muted">
              {voucher?.code ?? ""}
            </p>
          </div>
        ) : null}

        {/* Target Audience */}
        <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
          <p className="mb-2 text-sm font-semibold text-brand-text">Target Tampilan</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showForPublic}
                onChange={(e) => {
                  if (e.target.checked || showForRetail) setShowForPublic(e.target.checked);
                }}
              />
              Public
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showForRetail}
                onChange={(e) => {
                  if (e.target.checked || showForPublic) setShowForRetail(e.target.checked);
                }}
              />
              Retail
            </label>
          </div>
          <input type="hidden" name="showForPublic" value={showForPublic ? "1" : "0"} />
          <input type="hidden" name="showForRetail" value={showForRetail ? "1" : "0"} />
        </div>

      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold">Jumlah Diskon *</label>
          <input
            name="discountDisplay"
            type="text"
            inputMode="numeric"
            value={formatPrice(discountDisplay)}
            onChange={handlePriceInput(setDiscountDisplay)}
            onFocus={(e) => {
              const raw = e.target.value.replace(/\./g, "");
              setDiscountDisplay(raw);
            }}
            required
            className="mt-2 w-full rounded-md border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Minimal Harga Produk</label>
          <input
            name="minimumDisplay"
            type="text"
            inputMode="numeric"
            value={formatPrice(minimumDisplay)}
            onChange={handlePriceInput(setMinimumDisplay)}
            onFocus={(e) => {
              const raw = e.target.value.replace(/\./g, "");
              setMinimumDisplay(raw);
            }}
            className="mt-2 w-full rounded-md border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <Field
          label="Kuota Penggunaan"
          name="usageQuota"
          type="number"
          min="0"
          required
          defaultValue={voucher?.usageQuota ?? "0"}
        />
        <Field
          label="Tanggal Mulai"
          name="startsAt"
          type="datetime-local"
          required
          defaultValue={voucher?.startsAt}
        />
        <Field
          label="Tanggal Berakhir"
          name="endsAt"
          type="datetime-local"
          required
          defaultValue={voucher?.endsAt}
        />
      </div>

      <TextareaField
        label="Deskripsi"
        name="description"
        defaultValue={voucher?.description ?? ""}
        rows={3}
      />

      {/* Scope */}
      <div>
        <label className="block text-sm font-semibold">Cakupan Produk</label>
        <select
          name="scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as VoucherScope)}
          className="mt-2 w-full rounded-md border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
        >
          {scopeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional selectors */}
      {scope === "PRODUCTS" ? (
        <fieldset className="rounded-lg border border-brand-border bg-white p-4">
          <legend className="px-1 text-sm font-bold text-brand-primary">Pilih Produk</legend>
          <div className="mt-3 grid max-h-64 gap-2 overflow-auto">
            {products.map((product) => (
              <label key={product.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="productIds"
                  value={product.id}
                  defaultChecked={voucher?.productIds.includes(product.id)}
                />
                <span>{product.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {scope === "CATEGORIES" ? (
        <fieldset className="rounded-lg border border-brand-border bg-white p-4">
          <legend className="px-1 text-sm font-bold text-brand-primary">Pilih Kategori</legend>
          <div className="mt-3 grid gap-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={category.id}
                  defaultChecked={voucher?.categoryIds.includes(category.id)}
                />
                <span>{category.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-brand-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Menyimpan..." : isEdit ? "Simpan Voucher" : "Buat Voucher"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  step,
  min,
  readOnly,
  options,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  step?: string;
  min?: string;
  readOnly?: boolean;
  options?: Array<{ value: string; label: string }>;
}) {
  if (options) {
    return (
      <label className="block text-sm font-semibold">
        {label}
        <select
          name={name}
          defaultValue={defaultValue}
          className="mt-2 w-full rounded-md border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        min={min}
        readOnly={readOnly}
        className={`mt-2 w-full rounded-md border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary ${
          readOnly ? "bg-gray-100 text-brand-muted" : ""
        }`}
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  rows,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows: number;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="mt-2 w-full rounded-md border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
      />
    </label>
  );
}
