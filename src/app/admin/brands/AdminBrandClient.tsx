"use client";

import { useActionState, useState } from "react";
import { Plus, Pencil, Trash2, Power, PowerOff, X } from "lucide-react";
import Image from "next/image";

import type { SerializedBrand } from "./page";
import {
  createBrandAction,
  updateBrandAction,
  toggleBrandStatusAction,
  deleteBrandAction,
  type BrandFormState,
  type BrandStatusState,
  type BrandDeleteState,
} from "./actions";

const formInitial: BrandFormState = { success: false, message: "", error: "", fieldErrors: {} };
const statusInitial: BrandStatusState = { success: false, message: "", error: "" };
const deleteInitial: BrandDeleteState = { success: false, message: "", error: "" };

function getBrandInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);
}

export default function AdminBrandClient({
  brands,
}: {
  brands: SerializedBrand[];
}) {
  const total = brands.length;
  const activeCount = brands.filter((b) => b.isActive).length;
  const inactiveCount = total - activeCount;
  const totalProducts = brands.reduce((sum, b) => sum + b.productCount, 0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SerializedBrand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SerializedBrand | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<SerializedBrand | null>(null);

  const [createState, createAction, createPending] = useActionState(
    async (prev: BrandFormState, formData: FormData) => {
      const result = await createBrandAction(prev, formData);
      if (result.success) setCreateOpen(false);
      return result;
    },
    formInitial,
  );

  const [updateState, updateAction, updatePending] = useActionState(
    async (prev: BrandFormState, formData: FormData) => {
      const result = await updateBrandAction(prev, formData);
      if (result.success) setEditTarget(null);
      return result;
    },
    formInitial,
  );

  const [toggleState, toggleAction, togglePending] = useActionState(
    async (prev: BrandStatusState, formData: FormData) => {
      const result = await toggleBrandStatusAction(prev, formData);
      if (result.success) setToggleConfirm(null);
      return result;
    },
    statusInitial,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async (prev: BrandDeleteState, formData: FormData) => {
      const result = await deleteBrandAction(prev, formData);
      if (result.success) setDeleteTarget(null);
      return result;
    },
    deleteInitial,
  );

  function handleToggle(brand: SerializedBrand) {
    if (brand.isActive) {
      setToggleConfirm(brand);
    } else {
      const form = new FormData();
      form.set("id", brand.id);
      form.set("activate", "1");
      toggleAction(form);
    }
  }

  function confirmToggle() {
    if (!toggleConfirm) return;
    const form = new FormData();
    form.set("id", toggleConfirm.id);
    form.set("activate", "0");
    toggleAction(form);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const form = new FormData();
    form.set("id", deleteTarget.id);
    deleteAction(form);
  }

  const summaryCards = [
    { label: "Total Merek", value: total, color: "text-brand-on-light" },
    { label: "Merek Aktif", value: activeCount, color: "text-success" },
    { label: "Merek Nonaktif", value: inactiveCount, color: "text-warning" },
    { label: "Produk Terkait", value: totalProducts, color: "text-[#111827]" },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Merek</h1>
            <p className="mt-1 text-sm text-brand-muted">
              Kelola merek produk yang tampil di katalog.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-bold text-brand-on-accent transition hover:bg-brand-accent-hover"
          >
            <Plus size={18} />
            Tambah Merek
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="flex min-h-[88px] flex-col justify-center rounded-lg border border-brand-light bg-brand-soft-white p-4 text-brand-on-light shadow-sm"
            >
              <p className="text-xs font-semibold text-brand-muted-on-light">{card.label}</p>
              <p className={`mt-1 text-2xl font-extrabold leading-none tracking-tight ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {brands.length === 0 ? (
          <div className="rounded-lg border border-brand-light bg-brand-soft-white p-8 text-center text-sm font-semibold text-brand-muted-on-light">
            Belum ada merek. Klik &quot;Tambah Merek&quot; untuk mulai.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                onEdit={() => setEditTarget(brand)}
                onToggle={() => handleToggle(brand)}
                onDelete={() => setDeleteTarget(brand)}
                togglePending={togglePending}
                deletePending={deletePending}
              />
            ))}
          </div>
        )}
      </div>

      <BrandFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tambah Merek"
        action={createAction}
        state={createState}
        pending={createPending}
        mode="create"
      />

      {editTarget ? (
        <BrandFormModal
          open
          onClose={() => setEditTarget(null)}
          title="Edit Merek"
          action={updateAction}
          state={updateState}
          pending={updatePending}
          mode="edit"
          brand={editTarget}
        />
      ) : null}

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={deleteState.error && !deleteState.success ? "Tidak Dapat Menghapus" : "Hapus Merek?"}
        message={
          deleteState.error
            ? deleteState.error
            : "Merek akan dihapus permanen jika tidak sedang digunakan oleh produk."
        }
        isError={Boolean(deleteState.error) && !deleteState.success}
        confirmLabel="Ya, Hapus"
        cancelLabel="Tidak"
        pending={deletePending}
        onConfirm={confirmDelete}
      />

      <ConfirmModal
        open={toggleConfirm !== null}
        onClose={() => setToggleConfirm(null)}
        title="Nonaktifkan Merek?"
        message={
          toggleState.error
            ? toggleState.error
            : toggleConfirm && toggleConfirm.productCount > 0
              ? `Merek "${toggleConfirm.name}" memiliki ${toggleConfirm.productCount} produk. Jika dinonaktifkan, merek dan produk terkait dapat disembunyikan dari katalog publik. Lanjutkan?`
              : `Nonaktifkan merek "${toggleConfirm?.name}"? Merek tidak akan tampil di halaman publik.`
        }
        isError={Boolean(toggleState.error) && !toggleState.success}
        confirmLabel="Ya, Nonaktifkan"
        cancelLabel="Batal"
        pending={togglePending}
        onConfirm={confirmToggle}
      />
    </div>
  );
}

function BrandCard({
  brand,
  onEdit,
  onToggle,
  onDelete,
  togglePending,
  deletePending,
}: {
  brand: SerializedBrand;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  togglePending: boolean;
  deletePending: boolean;
}) {
  return (
    <div className="flex min-h-[250px] flex-col rounded-lg border border-brand-light bg-brand-soft-white p-4 text-brand-on-light shadow-sm transition hover:border-brand-accent hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {brand.logoUrl ? (
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[rgba(13,11,97,0.08)]">
              <Image src={brand.logoUrl} alt={brand.name} width={40} height={40} className="size-full object-cover" />
            </span>
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-accent text-sm font-black text-brand-on-accent">
              {getBrandInitials(brand.name)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-on-light">{brand.name}</p>
            <p className="truncate text-xs text-brand-muted-on-light">{brand.slug}</p>
          </div>
        </div>
        <span
          className={`shrink-0 self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            brand.isActive
              ? "bg-success/10 text-success"
              : "bg-warning/15 text-brand-on-light"
          }`}
        >
          {brand.isActive ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      <div className="mt-3 min-h-[2.5rem]">
        {brand.description ? (
          <p className="line-clamp-2 text-xs leading-5 text-brand-muted-on-light">
            {brand.description}
          </p>
        ) : (
          <p className="text-xs italic text-brand-muted-on-light">Tidak ada deskripsi.</p>
        )}
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-center gap-3 text-xs text-brand-muted-on-light">
          <span className="inline-flex items-center gap-1">
            <span>{brand.productCount > 0 ? brand.productCount : 0}</span>
            <span>{brand.productCount === 1 ? "produk" : "produk"}</span>
          </span>
          <span className="text-brand-muted-on-light">|</span>
          <span>Urutan {brand.sortOrder}</span>
        </div>
      </div>

      <div className="mt-3 border-t border-brand-light pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md bg-brand-accent px-2.5 py-1.5 text-[11px] font-bold text-brand-on-accent hover:bg-brand-accent-hover"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>

          <button
            type="button"
            onClick={onToggle}
            disabled={togglePending}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold disabled:opacity-60 ${
              brand.isActive
                ? "bg-warning/15 text-brand-on-light hover:bg-warning/25"
                : "bg-success/10 text-success hover:bg-success/15"
            }`}
          >
            {brand.isActive
              ? <PowerOff className="size-3.5" />
              : <Power className="size-3.5" />}
            {brand.isActive ? "Nonaktifkan" : "Aktifkan"}
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deletePending}
            className="inline-flex items-center gap-1 rounded-md bg-danger/10 px-2.5 py-1.5 text-[11px] font-semibold text-danger hover:bg-danger hover:text-white disabled:opacity-60"
          >
            <Trash2 className="size-3.5" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

function BrandFormModal({
  open,
  onClose,
  title,
  action,
  state,
  pending,
  mode,
  brand,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  action: (formData: FormData) => void;
  state: BrandFormState;
  pending: boolean;
  mode: "create" | "edit";
  brand?: SerializedBrand;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-12"
      onClick={onClose}
    >
      <div
        className="mx-4 mb-12 w-full max-w-lg rounded-2xl border border-brand-light bg-brand-soft-white p-6 text-brand-on-light shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-on-light">{title}</h2>
          <button type="button" onClick={onClose} className="text-brand-muted-on-light hover:text-brand-on-light">
            <X size={20} />
          </button>
        </div>

        <form action={action} className="grid gap-4">
          {mode === "edit" && brand ? (
            <input type="hidden" name="id" value={brand.id} />
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-semibold text-brand-on-light">Nama Merek</label>
            <input
              name="name"
              defaultValue={brand?.name ?? ""}
              required
              className="w-full rounded-lg border border-brand-light bg-white px-4 py-3 text-sm text-brand-on-light outline-none placeholder:text-brand-muted-on-light focus:border-brand-accent"
            />
            {state.fieldErrors.name ? (
              <p className="mt-1 text-xs text-danger">{state.fieldErrors.name}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-brand-on-light">Slug Merek</label>
            <input
              name="slug"
              defaultValue={brand?.slug ?? ""}
              placeholder="Otomatis dari nama"
              className="w-full rounded-lg border border-brand-light bg-white px-4 py-3 text-sm text-brand-on-light outline-none placeholder:text-brand-muted-on-light focus:border-brand-accent"
            />
            {state.fieldErrors.slug ? (
              <p className="mt-1 text-xs text-danger">{state.fieldErrors.slug}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-brand-on-light">Logo Merek</label>
            {mode === "edit" && brand?.logoUrl ? (
              <div className="mb-2 flex items-center gap-3">
                <Image src={brand.logoUrl} alt={brand.name} width={48} height={48} className="size-12 rounded-lg object-cover" />
                <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-danger">
                  <input type="checkbox" name="removeLogo" value="1" className="size-3.5 accent-danger" />
                  Hapus logo
                </label>
              </div>
            ) : null}
            <input
              type="file"
              name="logoUrl"
              accept=".jpg,.jpeg,.png,.webp"
              className="w-full text-sm text-brand-muted-on-light file:mr-3 file:rounded-lg file:border-0 file:bg-brand-accent file:px-3 file:py-2 file:text-xs file:font-bold file:text-brand-on-accent hover:file:bg-brand-accent-hover"
            />
            <p className="mt-1 text-[10px] text-brand-muted-on-light">JPG, PNG, atau WebP. Maks 2MB.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-brand-on-light">Deskripsi Merek</label>
            <textarea
              name="description"
              defaultValue={brand?.description ?? ""}
              rows={3}
              className="w-full rounded-lg border border-brand-light bg-white px-4 py-3 text-sm text-brand-on-light outline-none placeholder:text-brand-muted-on-light focus:border-brand-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-brand-on-light">Urutan</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={brand?.sortOrder ?? 0}
                className="w-full rounded-lg border border-brand-light bg-white px-4 py-3 text-sm text-brand-on-light outline-none placeholder:text-brand-muted-on-light focus:border-brand-accent"
              />
              {state.fieldErrors.sortOrder ? (
                <p className="mt-1 text-xs text-danger">{state.fieldErrors.sortOrder}</p>
              ) : null}
            </div>

            {mode === "create" ? (
              <div>
                <label className="mb-1 block text-sm font-semibold text-brand-on-light">Status Merek</label>
                <label className="flex h-[46px] cursor-pointer items-center gap-3 rounded-lg border border-brand-light bg-white px-4 text-sm text-brand-on-light">
                  <input
                    name="isActive"
                    type="checkbox"
                    defaultChecked
                    className="size-4 accent-brand-primary"
                  />
                  Aktif
                </label>
              </div>
            ) : null}
          </div>

          {state.error ? (
            <p className="rounded-lg bg-danger/5 p-3 text-sm text-danger">{state.error}</p>
          ) : null}

          {state.success ? (
            <p className="rounded-lg bg-success/5 p-3 text-sm text-success">{state.message}</p>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-brand-light pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-brand-light px-5 py-2.5 text-sm font-semibold text-brand-muted-on-light hover:bg-[rgba(13,11,97,0.08)] hover:text-brand-on-light"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-bold text-brand-on-accent hover:bg-brand-accent-hover disabled:opacity-60"
            >
              {pending ? "Menyimpan..." : "Simpan Merek"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  onClose,
  title,
  message,
  isError,
  confirmLabel,
  cancelLabel,
  pending,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  isError?: boolean;
  confirmLabel: string;
  cancelLabel: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border border-brand-light bg-brand-soft-white p-6 text-brand-on-light shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-brand-on-light">{title}</h3>
        <p className={`mt-2 text-sm leading-relaxed ${isError ? "text-danger" : "text-brand-muted-on-light"}`}>
          {message}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-brand-light px-4 py-2 text-xs font-semibold text-brand-muted-on-light hover:bg-[rgba(13,11,97,0.08)] hover:text-brand-on-light"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending || isError}
            onClick={onConfirm}
            className="rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
