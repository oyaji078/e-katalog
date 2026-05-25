"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";

import ToggleSwitch from "@/components/ui/ToggleSwitch";
import {
  createHeroBannerAction,
  type HeroBannerFormFields,
  type HeroBannerFormState,
  updateHeroBannerAction,
} from "./actions";

export type SerializedHeroBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  ctaLabel: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  mode: "create" | "edit";
  banner?: SerializedHeroBanner;
};

const emptyFields: HeroBannerFormFields = {
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaLabel: "",
  ctaHref: "",
  status: "ACTIVE",
  startsAt: "",
  endsAt: "",
  sortOrder: "0",
};

const initialState: HeroBannerFormState = {
  success: false,
  message: "",
  error: "",
  fieldErrors: {},
  fields: emptyFields,
};

function toInputDateValue(date: string | null | undefined): string {
  if (!date) return "";

  const parsed = new Date(date);
  if (!Number.isFinite(parsed.getTime())) return "";

  return parsed.toISOString().slice(0, 10);
}

function getInitialFields(banner?: SerializedHeroBanner): HeroBannerFormFields {
  if (!banner) return emptyFields;

  return {
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    imageUrl: banner.imageUrl ?? "",
    ctaLabel: banner.ctaLabel ?? "",
    ctaHref: banner.linkUrl ?? "",
    status: banner.isActive ? "ACTIVE" : "INACTIVE",
    startsAt: toInputDateValue(banner.startsAt),
    endsAt: toInputDateValue(banner.endsAt),
    sortOrder: String(banner.sortOrder),
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-danger">{message}</p>;
}

export default function HeroBannerFormClient({ mode, banner }: Props) {
  const submitAction = async (
    _previousState: HeroBannerFormState,
    formData: FormData,
  ): Promise<HeroBannerFormState> => {
    if (mode === "create") {
      return createHeroBannerAction(formData);
    }

    if (!banner) {
      return {
        ...initialState,
        error: "Hero banner tidak ditemukan.",
      };
    }

    return updateHeroBannerAction(banner.id, formData);
  };

  const [state, formAction, isPending] = useActionState(submitAction, initialState);
  const initialFields = useMemo(() => getInitialFields(banner), [banner]);
  const values = state.error ? state.fields : initialFields;
  const [previewUrl, setPreviewUrl] = useState<string | null>(values.imageUrl || null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="space-y-5">
      {removeImage ? <input type="hidden" name="removeImage" value="1" /> : null}

      {state.error ? (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-brand-text">
            Judul Banner <span className="text-danger">*</span>
          </label>
          <input
            id="title"
            name="title"
            defaultValue={values.title}
            required
            className="mt-1 w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
          />
          <FieldError message={state.fieldErrors.title} />
        </div>

        <div>
          <label htmlFor="subtitle" className="block text-sm font-semibold text-brand-text">
            Subjudul
          </label>
          <input
            id="subtitle"
            name="subtitle"
            defaultValue={values.subtitle}
            className="mt-1 w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
          />
          <FieldError message={state.fieldErrors.subtitle} />
        </div>

        <div>
          <label htmlFor="ctaLabel" className="block text-sm font-semibold text-brand-text">
            Teks Tombol
          </label>
          <input
            id="ctaLabel"
            name="ctaLabel"
            defaultValue={values.ctaLabel}
            placeholder="Contoh: Lihat Produk"
            className="mt-1 w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
          />
          <FieldError message={state.fieldErrors.ctaLabel} />
        </div>

        <div>
          <label htmlFor="ctaHref" className="block text-sm font-semibold text-brand-text">
            Link Tombol
          </label>
          <input
            id="ctaHref"
            name="ctaHref"
            defaultValue={values.ctaHref}
            placeholder="/products atau https://example.com"
            className="mt-1 w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
          />
          <FieldError message={state.fieldErrors.ctaHref} />
        </div>

        <div>
          <ToggleSwitch
            name="status"
            label="Status"
            description="Aktifkan banner ini untuk ditampilkan di halaman utama"
            defaultChecked={values.status === "ACTIVE"}
            onValue="ACTIVE"
            offValue="INACTIVE"
          />
          <FieldError message={state.fieldErrors.status} />
        </div>

        <div>
          <label htmlFor="sortOrder" className="block text-sm font-semibold text-brand-text">
            Urutan Tampilan
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            inputMode="numeric"
            defaultValue={values.sortOrder}
            className="mt-1 w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
          />
          <FieldError message={state.fieldErrors.sortOrder} />
        </div>

        <div>
          <label htmlFor="startsAt" className="block text-sm font-semibold text-brand-text">
            Tanggal Mulai
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="date"
            defaultValue={values.startsAt}
            className="mt-1 w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
          />
          <FieldError message={state.fieldErrors.startsAt} />
        </div>

        <div>
          <label htmlFor="endsAt" className="block text-sm font-semibold text-brand-text">
            Tanggal Berakhir
          </label>
          <input
            id="endsAt"
            name="endsAt"
            type="date"
            defaultValue={values.endsAt}
            className="mt-1 w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
          />
          <FieldError message={state.fieldErrors.endsAt} />
        </div>
      </div>

      <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
        <h3 className="text-sm font-bold text-brand-text">Gambar Banner</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <div
            className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-brand-border bg-white bg-cover bg-center text-xs text-brand-muted"
            style={previewUrl && !removeImage ? { backgroundImage: `url(${previewUrl})` } : undefined}
          >
            {!previewUrl || removeImage ? "Banner teks saja diperbolehkan" : null}
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-semibold text-brand-text">
                Link Gambar
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                defaultValue={values.imageUrl}
                onChange={(event) => {
                  setPreviewUrl(event.target.value.trim() || null);
                  setRemoveImage(false);
                }}
                placeholder="/uploads/promo-banners/banner.webp"
                className="mt-1 w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
              />
              <FieldError message={state.fieldErrors.imageUrl} />
            </div>

            <div>
              <label htmlFor="imageFile" className="block text-sm font-semibold text-brand-text">
                Upload Gambar
              </label>
              <input
                id="imageFile"
                name="imageFile"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setPreviewUrl(URL.createObjectURL(file));
                  setRemoveImage(false);
                }}
                className="mt-1 block w-full text-sm text-brand-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand-primary file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white"
              />
            </div>

            {previewUrl && !removeImage ? (
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setRemoveImage(true);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-sm font-semibold text-danger"
              >
                Hapus Gambar
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/admin/hero-banners"
          className="inline-flex justify-center rounded-lg border border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-muted"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex justify-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Menyimpan..." : mode === "create" ? "Buat Banner" : "Simpan Banner"}
        </button>
      </div>
    </form>
  );
}
