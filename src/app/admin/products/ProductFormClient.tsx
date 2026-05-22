"use client";

import { useActionState } from "react";
import type {
  Brand,
  Category,
  MarginType,
  Product,
  ProductImage,
  ProductStatus,
  StockStatus,
} from "@/generated/prisma/client";

import {
  createProductAction,
  type ProductFormState,
  updateProductAction,
} from "./actions";

type ProductFormClientProps = {
  mode: "create" | "edit";
  categories: Pick<Category, "id" | "name">[];
  brands: Pick<Brand, "id" | "name">[];
  product?: Product & { images: Pick<ProductImage, "url">[] };
};

const initialState: ProductFormState = {
  success: false,
  message: "",
  error: "",
  productId: "",
};

const marginOptions: Array<{ value: MarginType; label: string }> = [
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FIXED_AMOUNT", label: "Fixed amount" },
];

const stockOptions: Array<{ value: StockStatus; label: string }> = [
  { value: "READY", label: "Ready" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "PREORDER", label: "Preorder" },
];

const statusOptions: Array<{ value: ProductStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function ProductFormClient({
  mode,
  categories,
  brands,
  product,
}: ProductFormClientProps) {
  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}

      {state.error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-sm font-semibold text-success">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required defaultValue={product?.name} />
        <Field label="SKU" name="sku" required defaultValue={product?.sku} />
        <SelectField
          label="Category"
          name="categoryId"
          required
          defaultValue={product?.categoryId}
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />
        <SelectField
          label="Brand"
          name="brandId"
          required
          defaultValue={product?.brandId}
          options={brands.map((brand) => ({
            value: brand.id,
            label: brand.name,
          }))}
        />
      </div>

      <TextareaField
        label="Short specification"
        name="shortSpecification"
        defaultValue={product?.shortSpecification ?? ""}
        rows={2}
      />
      <TextareaField
        label="Description"
        name="description"
        required
        defaultValue={product?.description ?? ""}
        rows={4}
      />
      <TextareaField
        label="Technical specifications"
        name="specifications"
        defaultValue={formatSpecifications(product?.specifications)}
        rows={4}
        helper="Use JSON or one Key: Value pair per line."
      />
      <Field label="Warranty info" name="warrantyInfo" defaultValue={product?.warrantyInfo ?? ""} />

      <section className="rounded-2xl border border-border-gray bg-soft-bg p-4">
        <h2 className="text-lg font-bold">Price and margin</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Cost price"
            name="costPrice"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={decimalString(product?.costPrice)}
          />
          <SelectField
            label="Public margin type"
            name="publicMarginType"
            defaultValue={product?.publicMarginType ?? "PERCENTAGE"}
            options={marginOptions}
          />
          <Field
            label="Public margin value"
            name="publicMarginValue"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={decimalString(product?.publicMarginValue)}
          />
          <SelectField
            label="Retail margin type"
            name="retailMarginType"
            defaultValue={product?.retailMarginType ?? "PERCENTAGE"}
            options={marginOptions}
          />
          <Field
            label="Retail margin value"
            name="retailMarginValue"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={decimalString(product?.retailMarginValue)}
          />
          <Field
            label="Manual public price"
            name="publicPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={decimalString(product?.publicPrice)}
          />
          <Field
            label="Manual retail price"
            name="retailPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={decimalString(product?.retailPrice)}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Stock quantity"
          name="stockQuantity"
          type="number"
          min="0"
          defaultValue={String(product?.stockQuantity ?? 0)}
        />
        <SelectField
          label="Stock status"
          name="stockStatus"
          defaultValue={product?.stockStatus ?? "READY"}
          options={stockOptions}
        />
        <SelectField
          label="Product status"
          name="status"
          defaultValue={product?.status ?? "DRAFT"}
          options={statusOptions}
        />
        <Field
          label="Primary image URL"
          name="primaryImageUrl"
          defaultValue={product?.primaryImageUrl ?? ""}
        />
      </section>

      <TextareaField
        label="Additional image URLs"
        name="imageUrls"
        defaultValue={product?.images.map((image) => image.url).join("\n") ?? ""}
        rows={3}
        helper="One image URL per line."
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <CheckboxField label="Recommended" name="isRecommended" defaultChecked={product?.isRecommended} />
        <CheckboxField label="New arrival" name="isNewArrival" defaultChecked={product?.isNewArrival} />
        <CheckboxField label="Featured" name="isFeatured" defaultChecked={product?.isFeatured} />
        <CheckboxField label="Promo" name="isPromo" defaultChecked={product?.isPromo} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-primary-maroon px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : mode === "create" ? "Create Product" : "Save Product"}
      </button>
    </form>
  );
}

function decimalString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function formatSpecifications(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
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
        className="mt-2 w-full rounded-xl border border-border-gray px-4 py-3 text-sm outline-none focus:border-primary-maroon"
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  rows,
  required,
  helper,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows: number;
  required?: boolean;
  helper?: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        required={required}
        className="mt-2 w-full rounded-xl border border-border-gray px-4 py-3 text-sm outline-none focus:border-primary-maroon"
      />
      {helper ? <span className="mt-1 block text-xs font-normal text-text-muted">{helper}</span> : null}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  name,
  defaultValue,
  options,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: T | string;
  options: Array<{ value: T | string; label: string }>;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 w-full rounded-xl border border-border-gray px-4 py-3 text-sm outline-none focus:border-primary-maroon"
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-border-gray bg-white px-3 py-2 text-sm font-semibold">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}
