"use client";

import { useActionState } from "react";
import type {
  VoucherAudience,
  VoucherDiscountType,
  VoucherScope,
  VoucherStatus,
} from "@/generated/prisma/client";

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
  audience: VoucherAudience;
  status: VoucherStatus;
  discountType: VoucherDiscountType;
  discountValue: string;
  minimumPurchase: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
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

const audienceOptions: Array<{ value: VoucherAudience; label: string }> = [
  { value: "PUBLIC", label: "Public" },
  { value: "RETAIL", label: "Retail only" },
];

const statusOptions: Array<{ value: VoucherStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRED", label: "Expired" },
  { value: "DISABLED", label: "Disabled" },
];

const discountOptions: Array<{ value: VoucherDiscountType; label: string }> = [
  { value: "FIXED_AMOUNT", label: "Fixed amount" },
  { value: "PERCENTAGE", label: "Percentage" },
];

const scopeOptions: Array<{ value: VoucherScope; label: string }> = [
  { value: "ALL", label: "All products" },
  { value: "PRODUCTS", label: "Selected products" },
  { value: "CATEGORIES", label: "Selected categories" },
];

export default function VoucherFormClient({
  mode,
  products,
  categories,
  voucher,
}: VoucherFormClientProps) {
  const action = mode === "create" ? createVoucherAction : updateVoucherAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      {voucher ? <input type="hidden" name="voucherId" value={voucher.id} /> : null}

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
        <Field label="Code" name="code" required defaultValue={voucher?.code} />
        <Field label="Title" name="title" required defaultValue={voucher?.title} />
        <SelectField
          label="Audience"
          name="audience"
          defaultValue={voucher?.audience ?? "PUBLIC"}
          options={audienceOptions}
        />
        <SelectField
          label="Status"
          name="status"
          defaultValue={voucher?.status ?? "DRAFT"}
          options={statusOptions}
        />
        <SelectField
          label="Discount type"
          name="discountType"
          defaultValue={voucher?.discountType ?? "FIXED_AMOUNT"}
          options={discountOptions}
        />
        <Field
          label="Discount value"
          name="discountValue"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={voucher?.discountValue}
        />
        <Field
          label="Minimum purchase"
          name="minimumPurchase"
          type="number"
          step="0.01"
          min="0"
          defaultValue={voucher?.minimumPurchase}
        />
        <Field
          label="Usage quota"
          name="usageQuota"
          type="number"
          min="0"
          required
          defaultValue={voucher?.usageQuota ?? "0"}
        />
        <Field
          label="Start date"
          name="startsAt"
          type="datetime-local"
          required
          defaultValue={voucher?.startsAt}
        />
        <Field
          label="End date"
          name="endsAt"
          type="datetime-local"
          required
          defaultValue={voucher?.endsAt}
        />
      </div>

      <TextareaField
        label="Description"
        name="description"
        defaultValue={voucher?.description ?? ""}
        rows={3}
      />

      <SelectField
        label="Scope"
        name="scope"
        defaultValue={voucher?.scope ?? "ALL"}
        options={scopeOptions}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <fieldset className="rounded-lg border border-border-gray bg-white p-4">
          <legend className="px-1 text-sm font-bold text-primary-maroon">Selected products</legend>
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

        <fieldset className="rounded-lg border border-border-gray bg-white p-4">
          <legend className="px-1 text-sm font-bold text-primary-maroon">Selected categories</legend>
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
      </section>

      <label className="flex items-center gap-2 rounded-lg border border-border-gray bg-white px-3 py-2 text-sm font-semibold">
        <input name="isActive" type="checkbox" defaultChecked={voucher?.isActive ?? true} />
        Active voucher
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary-maroon px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : mode === "create" ? "Create Voucher" : "Save Voucher"}
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
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  step?: string;
  min?: string;
}) {
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
        className="mt-2 w-full rounded-md border border-border-gray px-4 py-3 text-sm outline-none focus:border-primary-maroon"
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
        className="mt-2 w-full rounded-md border border-border-gray px-4 py-3 text-sm outline-none focus:border-primary-maroon"
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: T | string;
  options: Array<{ value: T | string; label: string }>;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-md border border-border-gray px-4 py-3 text-sm outline-none focus:border-primary-maroon"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
