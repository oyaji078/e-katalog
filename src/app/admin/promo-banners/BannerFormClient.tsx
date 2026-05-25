"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";

import type { SerializedBannerVoucher } from "@/lib/banner-voucher";
import {
  createPromoBannerAction,
  type BannerFormFields,
  type BannerFormState,
  updatePromoBannerAction,
} from "./actions";

export type SerializedPromoBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  ctaLabel: string | null;
  showForPublic: boolean;
  showForRetail: boolean;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  linkType: "STANDALONE" | "VOUCHER";
  voucherId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  mode: "create" | "edit";
  banner?: SerializedPromoBanner;
  vouchers: SerializedBannerVoucher[];
};

const emptyFields: BannerFormFields = {
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaLabel: "",
  ctaHref: "",
  startsAt: "",
  endsAt: "",
  sortOrder: "0",
  showForPublic: "1",
  showForRetail: "0",
  voucherId: "",
};

const initialState: BannerFormState = {
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

function getInitialFields(banner?: SerializedPromoBanner): BannerFormFields {
  if (!banner) return emptyFields;

  return {
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    imageUrl: banner.imageUrl ?? "",
    ctaLabel: banner.ctaLabel ?? "",
    ctaHref: banner.linkUrl ?? "",
    startsAt: toInputDateValue(banner.startsAt),
    endsAt: toInputDateValue(banner.endsAt),
    sortOrder: String(banner.sortOrder),
    showForPublic: banner.showForPublic ? "1" : "0",
    showForRetail: banner.showForRetail ? "1" : "0",
    voucherId: banner.linkType === "VOUCHER" ? banner.voucherId ?? "" : "",
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-danger">{message}</p>;
}

export default function BannerFormClient({ mode, banner, vouchers }: Props) {
  const submitAction = async (
    _previousState: BannerFormState,
    formData: FormData,
  ): Promise<BannerFormState> => {
    if (mode === "create") {
      return createPromoBannerAction(formData);
    }

    if (!banner) {
      return {
        ...initialState,
        error: "Banner promo tidak ditemukan.",
      };
    }

    return updatePromoBannerAction(banner.id, formData);
  };

  const [state, formAction, isPending] = useActionState(submitAction, initialState);
  const initialFields = useMemo(() => getInitialFields(banner), [banner]);
  const values = state.error ? state.fields : initialFields;
  const [previewUrl, setPreviewUrl] = useState<string | null>(values.imageUrl || null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audiencePublic, setAudiencePublic] = useState(values.showForPublic === "1");
  const [audienceRetail, setAudienceRetail] = useState(values.showForRetail === "1");
  const [voucherId, setVoucherId] = useState(values.voucherId);
  const linkedVoucher = vouchers.find((voucher) => voucher.id === voucherId) ?? null;
  const isLinkedToVoucher = Boolean(voucherId);

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
            required={!isLinkedToVoucher}
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

        {!isLinkedToVoucher ? (
          <>
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
          </>
        ) : null}

        <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
          <p className="mb-2 text-sm font-semibold text-brand-text">Target Tampilan</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={audiencePublic}
                onChange={(e) => {
                  if (e.target.checked || audienceRetail) setAudiencePublic(e.target.checked);
                }}
              />
              Public
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={audienceRetail}
                onChange={(e) => {
                  if (e.target.checked || audiencePublic) setAudienceRetail(e.target.checked);
                }}
              />
              Retail
            </label>
          </div>
          <input type="hidden" name="showForPublic" value={audiencePublic ? "1" : "0"} />
          <input type="hidden" name="showForRetail" value={audienceRetail ? "1" : "0"} />
          <FieldError message={state.fieldErrors.showForPublic} />
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
      </div>

      <section className="rounded-lg border border-brand-border p-4">
        <label htmlFor="voucherId" className="block text-sm font-semibold text-brand-text">
          Hubungkan dengan Voucher
        </label>
        <select
          id="voucherId"
          name="voucherId"
          value={voucherId}
          onChange={(event) => setVoucherId(event.target.value)}
          className="mt-2 w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
        >
          <option value="">Tidak terhubung / Standalone</option>
          {vouchers.map((voucher) => (
            <option key={voucher.id} value={voucher.id}>
              {voucher.code} - {voucher.title}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors.voucherId} />

        {linkedVoucher ? (
          <div className={`mt-3 rounded-lg border p-3 text-sm ${
            linkedVoucher.isLive
              ? "border-success/20 bg-success/5 text-brand-text"
              : "border-warning/30 bg-warning/10 text-brand-text"
          }`}>
            <p className="font-bold">{linkedVoucher.code}</p>
            <div className="mt-2 grid gap-1 text-xs text-brand-muted sm:grid-cols-2">
              <span>Diskon: {linkedVoucher.discountLabel}</span>
              <span>Minimal harga: {linkedVoucher.minimumLabel}</span>
              <span>Audience: {linkedVoucher.audienceLabel}</span>
              <span>Jadwal: {linkedVoucher.scheduleLabel}</span>
            </div>
            {!linkedVoucher.isLive ? (
              <p className="mt-2 text-xs font-semibold text-warning">
                Voucher ini tidak aktif/valid. Banner tertaut tidak akan tampil publik sampai voucher aktif kembali.
              </p>
            ) : null}
          </div>
        ) : isLinkedToVoucher ? (
          <p className="mt-2 text-xs font-semibold text-warning">
            Voucher tertaut tidak ditemukan. Banner ini tidak akan tampil publik.
          </p>
        ) : (
          <p className="mt-2 text-xs text-brand-muted">
            Kosongkan untuk banner standalone dengan judul, CTA, audience, dan jadwal manual.
          </p>
        )}
      </section>

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
          href="/admin/promo-banners"
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
