"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";

import {
  DEFAULT_SITE_SETTINGS,
  type PublicSiteSettings,
} from "@/lib/site-settings-constants";
import {
  initialWebIdentityState,
  updateWebIdentityAction,
  type WebIdentityFields,
} from "./actions";

type Props = {
  settings: PublicSiteSettings;
};

function toFields(settings: PublicSiteSettings): WebIdentityFields {
  return {
    siteName: settings.siteName,
    storeName: settings.storeName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl ?? "",
    faviconUrl: settings.faviconUrl ?? "",
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    accentColor: settings.accentColor,
    whatsappNumber: settings.whatsappNumber,
    email: settings.email,
    address: settings.address,
    googleMapsUrl: settings.googleMapsUrl,
    businessHours: settings.businessHours,
    footerDescription: settings.footerDescription,
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-danger">{message}</p>;
}

function TextInput({
  id,
  label,
  value,
  error,
  required = false,
  type = "text",
  placeholder,
}: {
  id: keyof WebIdentityFields;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-brand-text">
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        defaultValue={value}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary"
      />
      <FieldError message={error} />
    </div>
  );
}

function TextArea({
  id,
  label,
  value,
  error,
  required = false,
  rows = 3,
  placeholder,
}: {
  id: keyof WebIdentityFields;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-brand-text">
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <textarea
        id={id}
        name={id}
        defaultValue={value}
        required={required}
        rows={rows}
        placeholder={placeholder}
        className="mt-1 w-full resize-y rounded-xl border border-brand-border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary"
      />
      <FieldError message={error} />
    </div>
  );
}

function ColorControl({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: "primaryColor" | "secondaryColor" | "accentColor";
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-brand-text">
        {label} <span className="text-danger">*</span>
      </label>
      <div className="mt-1 grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
        <input
          aria-label={`${label} picker`}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-12 w-12 rounded-xl border border-brand-border bg-white p-1"
        />
        <input
          id={id}
          name={id}
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="w-full rounded-xl border border-brand-border bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-brand-primary"
        />
      </div>
      <FieldError message={error} />
    </div>
  );
}

function ImageUpload({
  kind,
  label,
  preview,
  setPreview,
  remove,
  setRemove,
  error,
  fileInputRef,
}: {
  kind: "logo" | "favicon";
  label: string;
  preview: string | null;
  setPreview: (value: string | null) => void;
  remove: boolean;
  setRemove: (value: boolean) => void;
  error?: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-bg p-4">
      {remove ? <input type="hidden" name={kind === "logo" ? "removeLogo" : "removeFavicon"} value="1" /> : null}
      <input type="hidden" name={kind === "logo" ? "logoUrl" : "faviconUrl"} value={preview ?? ""} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-brand-border bg-white text-xs font-bold text-brand-muted">
          {preview && !remove ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={label}
              className="h-full w-full object-contain p-2"
              onError={() => setPreview(null)}
            />
          ) : (
            label
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label className="block text-sm font-semibold text-brand-text" htmlFor={`${kind}File`}>
            {label}
          </label>
          <input
            ref={fileInputRef}
            id={`${kind}File`}
            name={`${kind}File`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setPreview(URL.createObjectURL(file));
              setRemove(false);
            }}
            className="mt-2 block w-full text-sm text-brand-muted file:mr-4 file:rounded-xl file:border-0 file:bg-brand-primary file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white"
          />
          <p className="mt-2 text-xs text-brand-muted">JPG, PNG, atau WebP. Maksimal 2 MB.</p>
          <FieldError message={error} />
          {preview && !remove ? (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setRemove(true);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="mt-2 text-sm font-semibold text-danger"
            >
              Hapus {label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-black text-brand-text">{title}</h2>
        <p className="mt-1 text-sm text-brand-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default function SiteSettingsFormClient({ settings }: Props) {
  const initialFields = useMemo(() => toFields(settings), [settings]);
  const [state, formAction, isPending] = useActionState(
    updateWebIdentityAction,
    initialWebIdentityState,
  );
  const values = state.error || state.success ? state.fields : initialFields;
  const [primaryColor, setPrimaryColor] = useState(values.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(values.secondaryColor);
  const [accentColor, setAccentColor] = useState(values.accentColor);
  const [logoPreview, setLogoPreview] = useState<string | null>(values.logoUrl || null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(values.faviconUrl || null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeFavicon, setRemoveFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div className="rounded-2xl border border-success/20 bg-success/5 p-4 text-sm font-semibold text-success">
          {state.message}
        </div>
      ) : null}

      <Section
        title="Identitas Website"
        description="Atur nama, tagline, logo, dan favicon yang tampil di frontend."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TextInput
            id="siteName"
            label="Nama Website"
            value={values.siteName}
            error={state.fieldErrors.siteName}
            required
          />
          <TextInput
            id="storeName"
            label="Nama Toko"
            value={values.storeName}
            error={state.fieldErrors.storeName}
            required
          />
          <div className="lg:col-span-2">
            <TextArea
              id="tagline"
              label="Tagline"
              value={values.tagline}
              error={state.fieldErrors.tagline}
              required
              rows={2}
            />
          </div>
          <ImageUpload
            kind="logo"
            label="Logo"
            preview={logoPreview}
            setPreview={setLogoPreview}
            remove={removeLogo}
            setRemove={setRemoveLogo}
            error={state.fieldErrors.logoUrl}
            fileInputRef={logoInputRef}
          />
          <ImageUpload
            kind="favicon"
            label="Favicon"
            preview={faviconPreview}
            setPreview={setFaviconPreview}
            remove={removeFavicon}
            setRemove={setRemoveFavicon}
            error={state.fieldErrors.faviconUrl}
            fileInputRef={faviconInputRef}
          />
        </div>
      </Section>

      <Section
        title="Warna Tampilan"
        description="Gunakan color picker atau input hex. Perubahan preview tampil langsung."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <ColorControl
            id="primaryColor"
            label="Warna Utama"
            value={primaryColor}
            error={state.fieldErrors.primaryColor}
            onChange={setPrimaryColor}
          />
          <ColorControl
            id="secondaryColor"
            label="Warna Sekunder"
            value={secondaryColor}
            error={state.fieldErrors.secondaryColor}
            onChange={setSecondaryColor}
          />
          <ColorControl
            id="accentColor"
            label="Warna Aksen"
            value={accentColor}
            error={state.fieldErrors.accentColor}
            onChange={setAccentColor}
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl p-4 text-sm font-bold text-white" style={{ backgroundColor: primaryColor }}>
            Primary
          </div>
          <div className="rounded-2xl p-4 text-sm font-bold text-white" style={{ backgroundColor: secondaryColor }}>
            Secondary
          </div>
          <div className="rounded-2xl p-4 text-sm font-bold text-brand-text" style={{ backgroundColor: accentColor }}>
            Accent
          </div>
        </div>
      </Section>

      <Section
        title="Kontak Toko"
        description="Informasi kontak ini dipakai untuk WhatsApp, footer, dan lokasi toko."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TextInput
            id="whatsappNumber"
            label="Nomor WhatsApp"
            value={values.whatsappNumber}
            error={state.fieldErrors.whatsappNumber}
            required
            placeholder="08123456789"
          />
          <TextInput
            id="email"
            label="Email Toko"
            value={values.email}
            error={state.fieldErrors.email}
            type="email"
            placeholder="admin@ramakomputer.test"
          />
          <div className="lg:col-span-2">
            <TextArea
              id="address"
              label="Alamat Toko"
              value={values.address}
              error={state.fieldErrors.address}
              rows={3}
            />
          </div>
          <TextInput
            id="googleMapsUrl"
            label="Link Google Maps"
            value={values.googleMapsUrl}
            error={state.fieldErrors.googleMapsUrl}
            placeholder="https://maps.google.com/..."
          />
          <TextInput
            id="businessHours"
            label="Jam Operasional"
            value={values.businessHours}
            error={state.fieldErrors.businessHours}
            placeholder="Senin-Sabtu, 09.00-18.00"
          />
        </div>
      </Section>

      <Section title="Footer" description="Teks singkat yang menjelaskan toko di footer publik.">
        <TextArea
          id="footerDescription"
          label="Deskripsi Footer Singkat"
          value={values.footerDescription}
          error={state.fieldErrors.footerDescription}
          required
          rows={3}
        />
      </Section>

      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          name="intent"
          value="reset-colors"
          disabled={isPending}
          onClick={() => {
            setPrimaryColor(DEFAULT_SITE_SETTINGS.primaryColor);
            setSecondaryColor(DEFAULT_SITE_SETTINGS.secondaryColor);
            setAccentColor(DEFAULT_SITE_SETTINGS.accentColor);
          }}
          className="rounded-xl border border-brand-border px-5 py-2.5 text-sm font-bold text-brand-primary transition hover:border-brand-primary disabled:opacity-60"
        >
          Reset ke Warna Default
        </button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Link
            href="/admin"
            className="inline-flex justify-center rounded-xl border border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-muted transition hover:bg-brand-bg"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex justify-center rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-black text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </form>
  );
}
