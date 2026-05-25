"use client";

import { createElement, useActionState, useState } from "react";
import { Plus, Pencil, Trash2, Power, PowerOff, X } from "lucide-react";

import { getCategoryIcon, CATEGORY_ICONS } from "@/lib/category-icons";
import type { SerializedCategory } from "./page";
import {
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryStatusAction,
  deleteCategoryAction,
  type CategoryFormState,
  type CategoryStatusState,
  type CategoryDeleteState,
} from "./actions";

const formInitial: CategoryFormState = { success: false, message: "", error: "", fieldErrors: {} };
const statusInitial: CategoryStatusState = { success: false, message: "", error: "" };
const deleteInitial: CategoryDeleteState = { success: false, message: "", error: "" };

export default function AdminCategoryClient({
  categories,
}: {
  categories: SerializedCategory[];
}) {
  const total = categories.length;
  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = total - activeCount;
  const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SerializedCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SerializedCategory | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<SerializedCategory | null>(null);

  const [createState, createAction, createPending] = useActionState(
    async (prev: CategoryFormState, formData: FormData) => {
      const result = await createCategoryAction(prev, formData);
      if (result.success) setCreateOpen(false);
      return result;
    },
    formInitial,
  );

  const [updateState, updateAction, updatePending] = useActionState(
    async (prev: CategoryFormState, formData: FormData) => {
      const result = await updateCategoryAction(prev, formData);
      if (result.success) setEditTarget(null);
      return result;
    },
    formInitial,
  );

  const [toggleState, toggleAction, togglePending] = useActionState(
    async (prev: CategoryStatusState, formData: FormData) => {
      const result = await toggleCategoryStatusAction(prev, formData);
      if (result.success) setToggleConfirm(null);
      return result;
    },
    statusInitial,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async (prev: CategoryDeleteState, formData: FormData) => {
      const result = await deleteCategoryAction(prev, formData);
      if (result.success) setDeleteTarget(null);
      return result;
    },
    deleteInitial,
  );

  function handleToggle(category: SerializedCategory) {
    if (category.isActive) {
      setToggleConfirm(category);
    } else {
      const form = new FormData();
      form.set("id", category.id);
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
    { label: "Total Kategori", value: total, color: "text-brand-primary" },
    { label: "Kategori Aktif", value: activeCount, color: "text-success" },
    { label: "Kategori Nonaktif", value: inactiveCount, color: "text-warning" },
    { label: "Produk Terkait", value: totalProducts, color: "text-brand-secondary" },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kategori</h1>
            <p className="mt-1 text-sm text-brand-muted">
              Kelola kategori produk yang tampil di katalog.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            <Plus size={18} />
            Tambah Kategori
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="flex min-h-[88px] flex-col justify-center rounded-lg border border-brand-border bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-semibold text-brand-muted">{card.label}</p>
              <p className={`mt-1 text-2xl font-extrabold leading-none tracking-tight ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {categories.length === 0 ? (
          <div className="rounded-lg border border-brand-border bg-white p-8 text-center text-sm text-brand-muted">
            Belum ada kategori. Klik &quot;Tambah Kategori&quot; untuk mulai.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={() => setEditTarget(category)}
                onToggle={() => handleToggle(category)}
                onDelete={() => setDeleteTarget(category)}
                togglePending={togglePending}
                deletePending={deletePending}
              />
            ))}
          </div>
        )}
      </div>

      <CategoryFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tambah Kategori"
        action={createAction}
        state={createState}
        pending={createPending}
        mode="create"
      />

      {editTarget ? (
        <CategoryFormModal
          open
          onClose={() => setEditTarget(null)}
          title="Edit Kategori"
          action={updateAction}
          state={updateState}
          pending={updatePending}
          mode="edit"
          category={editTarget}
        />
      ) : null}

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Kategori?"
        message={
          deleteState.error
            ? deleteState.error
            : "Kategori akan dihapus permanen jika tidak sedang digunakan oleh produk."
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
        title="Nonaktifkan Kategori?"
        message={
          toggleState.error
            ? toggleState.error
            : `Nonaktifkan kategori "${toggleConfirm?.name}"? Kategori tidak akan tampil di halaman publik.`
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

function CategoryCard({
  category,
  onEdit,
  onToggle,
  onDelete,
  togglePending,
  deletePending,
}: {
  category: SerializedCategory;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  togglePending: boolean;
  deletePending: boolean;
}) {
  const categoryIcon = getCategoryIcon(category.icon);

  return (
    <div className="flex min-h-[260px] flex-col rounded-lg border border-brand-border bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand-primary">
            {createElement(categoryIcon, { className: "size-5" })}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{category.name}</p>
            <p className="truncate text-xs text-brand-muted">{category.slug}</p>
          </div>
        </div>
        <span
          className={`shrink-0 self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            category.isActive
              ? "bg-success/10 text-success"
              : "bg-warning/15 text-warning"
          }`}
        >
          {category.isActive ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      <div className="mt-3 min-h-[2.5rem]">
        {category.description ? (
          <p className="line-clamp-2 text-xs leading-5 text-brand-muted">
            {category.description}
          </p>
        ) : (
          <p className="text-xs italic text-brand-muted/40">Tidak ada deskripsi.</p>
        )}
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-center gap-3 text-xs text-brand-muted">
          <span className="inline-flex items-center gap-1">
            <span>{category.productCount > 0 ? category.productCount : 0}</span>
            <span>{category.productCount === 1 ? "produk" : "produk"}</span>
          </span>
          <span className="text-brand-muted/30">|</span>
          <span>Urutan {category.sortOrder}</span>
        </div>
      </div>

      <div className="mt-3 border-t border-brand-border pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md bg-brand-bg px-2.5 py-1.5 text-[11px] font-semibold text-brand-primary hover:bg-brand-primary hover:text-white"
          >
            {createElement(Pencil, { className: "size-3.5" })}
            Edit
          </button>

          <button
            type="button"
            onClick={onToggle}
            disabled={togglePending}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold disabled:opacity-60 ${
              category.isActive
                ? "bg-warning/15 text-warning hover:bg-warning/25"
                : "bg-success/10 text-success hover:bg-success/15"
            }`}
          >
            {category.isActive
              ? createElement(PowerOff, { className: "size-3.5" })
              : createElement(Power, { className: "size-3.5" })}
            {category.isActive ? "Nonaktifkan" : "Aktifkan"}
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deletePending}
            className="inline-flex items-center gap-1 rounded-md bg-danger/10 px-2.5 py-1.5 text-[11px] font-semibold text-danger hover:bg-danger/15 disabled:opacity-60"
          >
            {createElement(Trash2, { className: "size-3.5" })}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryFormModal({
  open,
  onClose,
  title,
  action,
  state,
  pending,
  mode,
  category,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  action: (formData: FormData) => void;
  state: CategoryFormState;
  pending: boolean;
  mode: "create" | "edit";
  category?: SerializedCategory;
}) {
  const [selectedIcon, setSelectedIcon] = useState(category?.icon ?? "");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-12"
      onClick={onClose}
    >
      <div
        className="mx-4 mb-12 w-full max-w-lg rounded-2xl border border-brand-border bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-brand-muted hover:text-brand-text">
            <X size={20} />
          </button>
        </div>

        <form action={action} className="grid gap-4">
          {mode === "edit" && category ? (
            <input type="hidden" name="id" value={category.id} />
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-semibold">Nama Kategori</label>
            <input
              name="name"
              defaultValue={category?.name ?? ""}
              required
              className="w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
            />
            {state.fieldErrors.name ? (
              <p className="mt-1 text-xs text-danger">{state.fieldErrors.name}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Slug</label>
            <input
              name="slug"
              defaultValue={category?.slug ?? ""}
              placeholder="Otomatis dari nama"
              className="w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
            />
            {state.fieldErrors.slug ? (
              <p className="mt-1 text-xs text-danger">{state.fieldErrors.slug}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Ikon Kategori</label>
            <input type="hidden" name="icon" value={selectedIcon} />
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setSelectedIcon("")}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition ${
                  selectedIcon === ""
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                    : "border-brand-border text-brand-muted hover:border-brand-primary"
                }`}
              >
                <span className="text-lg">?</span>
                <span>Lainnya</span>
              </button>
              {CATEGORY_ICONS.map((entry) => {
                const Icon = entry.icon;
                return (
                  <button
                    key={entry.value}
                    type="button"
                    onClick={() => setSelectedIcon(entry.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition ${
                      selectedIcon === entry.value
                        ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                        : "border-brand-border text-brand-muted hover:border-brand-primary"
                    }`}
                  >
                    <Icon className="size-5" />
                    <span>{entry.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Deskripsi</label>
            <textarea
              name="description"
              defaultValue={category?.description ?? ""}
              rows={3}
              className="w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">Urutan</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={category?.sortOrder ?? 0}
                className="w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
              />
              {state.fieldErrors.sortOrder ? (
                <p className="mt-1 text-xs text-danger">{state.fieldErrors.sortOrder}</p>
              ) : null}
            </div>

            {mode === "create" ? (
              <div>
                <label className="mb-1 block text-sm font-semibold">Status</label>
                <label className="flex h-[46px] cursor-pointer items-center gap-3 rounded-lg border border-brand-border px-4 text-sm">
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

          <div className="flex justify-end gap-3 border-t border-brand-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-muted hover:bg-brand-bg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {pending ? "Menyimpan..." : "Simpan Kategori"}
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
        className="mx-4 w-full max-w-sm rounded-2xl border border-brand-border bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-brand-text">{title}</h3>
        <p className={`mt-2 text-sm leading-relaxed ${isError ? "text-danger" : "text-brand-muted"}`}>
          {message}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
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
