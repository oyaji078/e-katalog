"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";

import {
  DEFAULT_SITE_SETTINGS,
  type PublicSiteSettings,
} from "@/lib/site-settings-constants";
import { updateWebIdentityAction } from "./actions";
import { initialWebIdentityState, type WebIdentityFields } from "./form-state";

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
    textColor: settings.textColor,
    mutedColor: settings.mutedColor,
    borderColor: settings.borderColor,
    supportColor: settings.supportColor,
    whatsappColor: settings.whatsappColor,
    whatsappNumber: settings.whatsappNumber,
    email: settings.email,
    address: settings.address,
    googleMapsUrl: settings.googleMapsUrl,
    businessHours: settings.businessHours,
    footerDescription: settings.footerDescription,
    announcementEnabled: settings.announcementEnabled ? "on" : "",
    announcementText: settings.announcementText,
    announcementSpeed: String(settings.announcementSpeed),
    announcementLink: settings.announcementLink,
  };
}

type FieldErrorMessage = string | string[] | undefined;

function FieldError({ message }: { message?: FieldErrorMessage }) {
  const text = Array.isArray(message) ? message[0] : message;
  if (!text) return null;
  return <p className="mt-1 text-xs font-semibold text-danger">{text}</p>;
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
  error?: FieldErrorMessage;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-brand-on-light">
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        defaultValue={value}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-brand-light bg-white px-4 py-3 text-sm text-brand-on-light outline-none transition placeholder:text-brand-muted-on-light focus:border-brand-accent"
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
  error?: FieldErrorMessage;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-brand-on-light">
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <textarea
        id={id}
        name={id}
        defaultValue={value}
        required={required}
        rows={rows}
        placeholder={placeholder}
        className="mt-1 w-full resize-y rounded-xl border border-brand-light bg-white px-4 py-3 text-sm text-brand-on-light outline-none transition placeholder:text-brand-muted-on-light focus:border-brand-accent"
      />
      <FieldError message={error} />
    </div>
  );
}

function ColorControl({
  id,
  label,
  hint,
  value,
  error,
  onChange,
}: {
  id:
    | "primaryColor"
    | "secondaryColor"
    | "accentColor"
    | "supportColor"
    | "textColor"
    | "mutedColor"
    | "borderColor"
    | "whatsappColor";
  label: string;
  hint?: string;
  value: string;
  error?: FieldErrorMessage;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-brand-on-light">
        {label} <span className="text-danger">*</span>
      </label>
      <div className="mt-1 grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
        <input
          aria-label={`${label} picker`}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-12 w-12 rounded-xl border border-brand-light bg-white p-1"
        />
        <input
          id={id}
          name={id}
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="w-full rounded-xl border border-brand-light bg-white px-4 py-3 font-mono text-sm text-brand-on-light outline-none transition focus:border-brand-accent"
        />
      </div>
      {hint ? <p className="mt-1 text-xs text-brand-muted-on-light">{hint}</p> : null}
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
  error?: FieldErrorMessage;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="rounded-2xl border border-brand-light bg-[rgba(13,11,97,0.05)] p-4 text-brand-on-light">
      {remove ? <input type="hidden" name={kind === "logo" ? "removeLogo" : "removeFavicon"} value="1" /> : null}
      <input type="hidden" name={kind === "logo" ? "logoUrl" : "faviconUrl"} value={preview ?? ""} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-brand-light bg-white text-xs font-bold text-brand-muted-on-light">
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
          <label className="block text-sm font-semibold text-brand-on-light" htmlFor={`${kind}File`}>
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
            className="mt-2 block w-full text-sm text-brand-muted-on-light file:mr-4 file:rounded-xl file:border-0 file:bg-brand-accent file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-brand-on-accent hover:file:bg-brand-accent-hover"
          />
          <p className="mt-2 text-xs text-brand-muted-on-light">JPG, PNG, atau WebP. Maksimal 2 MB.</p>
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
    <section className="rounded-2xl border border-brand-light bg-brand-soft-white p-5 text-brand-on-light shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-black text-brand-on-light">{title}</h2>
        <p className="mt-1 text-sm text-brand-muted-on-light">{description}</p>
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
  const fieldErrors = state?.fieldErrors ?? {};
  const [primaryColor, setPrimaryColor] = useState(values.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(values.secondaryColor);
  const [accentColor, setAccentColor] = useState(values.accentColor);
  const [textColor, setTextColor] = useState(values.textColor);
  const [mutedColor, setMutedColor] = useState(values.mutedColor);
  const [supportColor, setSupportColor] = useState(values.supportColor);
  const [whatsappColor, setWhatsappColor] = useState(values.whatsappColor);
  const [borderColor, setBorderColor] = useState(values.borderColor);
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
            error={fieldErrors.siteName}
            required
          />
          <TextInput
            id="storeName"
            label="Nama Toko"
            value={values.storeName}
            error={fieldErrors.storeName}
            required
          />
          <div className="lg:col-span-2">
            <TextArea
              id="tagline"
              label="Tagline"
              value={values.tagline}
              error={fieldErrors.tagline}
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
            error={fieldErrors.logoUrl}
            fileInputRef={logoInputRef}
          />
          <ImageUpload
            kind="favicon"
            label="Favicon"
            preview={faviconPreview}
            setPreview={setFaviconPreview}
            remove={removeFavicon}
            setRemove={setRemoveFavicon}
            error={fieldErrors.faviconUrl}
            fileInputRef={faviconInputRef}
          />
        </div>
      </Section>

      <Section
        title="Warna Tampilan 60/30/10"
        description="60% base, 30% surface, 10% aksen + warna pendukung. Kosongkan untuk memakai nilai bawaan."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <ColorControl
            id="primaryColor"
            label="Warna Utama 60%"
            hint="60% digunakan untuk background utama."
            value={primaryColor}
            error={fieldErrors.primaryColor}
            onChange={setPrimaryColor}
          />
          <ColorControl
            id="secondaryColor"
            label="Warna Sekunder 30%"
            hint="30% digunakan untuk card, navbar, dan section."
            value={secondaryColor}
            error={fieldErrors.secondaryColor}
            onChange={setSecondaryColor}
          />
          <ColorControl
            id="accentColor"
            label="Warna Aksen 10%"
            hint="10% digunakan untuk CTA, badge, dan aksen aktif."
            value={accentColor}
            error={fieldErrors.accentColor}
            onChange={setAccentColor}
          />
          <ColorControl
            id="textColor"
            label="Warna Teks Utama"
            value={textColor}
            error={fieldErrors.textColor}
            onChange={setTextColor}
          />
          <ColorControl
            id="mutedColor"
            label="Warna Teks Redup"
            value={mutedColor}
            error={fieldErrors.mutedColor}
            onChange={setMutedColor}
          />
          <ColorControl
            id="supportColor"
            label="Warna Pendukung"
            hint="Digunakan untuk hover, chip kategori, panel info, dan tombol sekunder."
            value={supportColor}
            error={fieldErrors.supportColor}
            onChange={setSupportColor}
          />
          <ColorControl
            id="borderColor"
            label="Warna Netral / Border"
            hint="Digunakan untuk garis, border, divider, dan elemen pasif."
            value={borderColor}
            error={fieldErrors.borderColor}
            onChange={setBorderColor}
          />
          <ColorControl
            id="whatsappColor"
            label="Warna WhatsApp"
            value={whatsappColor}
            error={fieldErrors.whatsappColor}
            onChange={setWhatsappColor}
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl p-4 text-sm font-bold" style={{ backgroundColor: primaryColor, color: textColor }}>
            <p>Base 60%</p>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>Primary background</p>
          </div>
          <div className="rounded-2xl p-4 text-sm font-bold" style={{ backgroundColor: secondaryColor, color: textColor }}>
            <p>Surface 30%</p>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>Panel/card surface</p>
          </div>
          <div className="rounded-2xl p-4 text-sm font-bold" style={{ backgroundColor: supportColor, color: textColor }}>
            <p>Support</p>
            <p className="mt-1 text-xs" style={{ color: textColor }}>Hover/secondary surface</p>
          </div>
          <div className="rounded-2xl p-4 text-sm font-bold" style={{ backgroundColor: accentColor, color: "#0D0B61" }}>
            <p>Accent 10%</p>
            <p className="mt-1 text-xs" style={{ color: "#0D0B61" }}>CTA and active state</p>
          </div>
          <div className="rounded-2xl border p-4 text-sm font-bold" style={{ backgroundColor: "#FFFFFF", borderColor, color: "#0D0B61" }}>
            <p>Text on Light</p>
            <p className="mt-1 text-xs" style={{ color: "#294669" }}>Readable admin card text</p>
          </div>
          <div className="rounded-2xl border p-4 text-sm font-bold" style={{ backgroundColor: secondaryColor, borderColor: "rgba(255,255,255,0.14)", color: textColor }}>
            <p>Muted on Dark</p>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>Readable secondary text</p>
          </div>
        </div>
      </Section>

      <Section
        title="Tulisan Berjalan"
        description="Kontrol announcement bar yang tampil di bagian atas halaman publik."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-brand-light bg-[rgba(13,11,97,0.05)] px-4 py-3 text-sm font-semibold text-brand-on-light">
            <input
              type="checkbox"
              name="announcementEnabled"
              defaultChecked={values.announcementEnabled === "on"}
              className="size-4 accent-brand-primary"
            />
            Aktifkan Tulisan Berjalan
          </label>
          <TextInput
            id="announcementSpeed"
            label="Kecepatan Tulisan"
            value={values.announcementSpeed}
            error={fieldErrors.announcementSpeed}
            type="number"
            placeholder="30"
          />
          <div className="lg:col-span-2">
            <TextArea
              id="announcementText"
              label="Teks Tulisan Berjalan"
              value={values.announcementText}
              error={fieldErrors.announcementText}
              rows={2}
              placeholder="Promo dan pengumuman katalog..."
            />
          </div>
          <div className="lg:col-span-2">
            <TextInput
              id="announcementLink"
              label="Link Tujuan, opsional"
              value={values.announcementLink}
              error={fieldErrors.announcementLink}
              placeholder="/products atau https://..."
            />
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
            error={fieldErrors.whatsappNumber}
            required
            placeholder="08123456789"
          />
          <TextInput
            id="email"
            label="Email Toko"
            value={values.email}
            error={fieldErrors.email}
            type="email"
            placeholder="admin@ramakomputer.test"
          />
          <div className="lg:col-span-2">
            <TextArea
              id="address"
              label="Alamat Toko"
              value={values.address}
              error={fieldErrors.address}
              rows={3}
            />
          </div>
          <TextInput
            id="googleMapsUrl"
            label="Link Google Maps"
            value={values.googleMapsUrl}
            error={fieldErrors.googleMapsUrl}
            placeholder="https://maps.google.com/..."
          />
          <TextInput
            id="businessHours"
            label="Jam Operasional"
            value={values.businessHours}
            error={fieldErrors.businessHours}
            placeholder="Senin-Sabtu, 09.00-18.00"
          />
        </div>
      </Section>

      <Section title="Footer" description="Teks singkat yang menjelaskan toko di footer publik.">
        <TextArea
          id="footerDescription"
          label="Deskripsi Footer Singkat"
          value={values.footerDescription}
          error={fieldErrors.footerDescription}
          required
          rows={3}
        />
      </Section>

      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-brand-light bg-brand-soft-white p-4 text-brand-on-light shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          name="intent"
          value="reset-colors"
          disabled={isPending}
          onClick={() => {
            setPrimaryColor(DEFAULT_SITE_SETTINGS.primaryColor);
            setSecondaryColor(DEFAULT_SITE_SETTINGS.secondaryColor);
            setAccentColor(DEFAULT_SITE_SETTINGS.accentColor);
            setTextColor(DEFAULT_SITE_SETTINGS.textColor);
            setMutedColor(DEFAULT_SITE_SETTINGS.mutedColor);
            setSupportColor(DEFAULT_SITE_SETTINGS.supportColor);
            setBorderColor(DEFAULT_SITE_SETTINGS.borderColor);
            setWhatsappColor(DEFAULT_SITE_SETTINGS.whatsappColor);
          }}
          className="rounded-xl border border-brand-light px-5 py-2.5 text-sm font-bold text-brand-on-light transition hover:border-brand-accent hover:bg-[rgba(13,11,97,0.06)] disabled:opacity-60"
        >
          Reset ke Warna Default
        </button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Link
            href="/admin"
            className="inline-flex justify-center rounded-xl border border-brand-light px-5 py-2.5 text-sm font-semibold text-brand-muted-on-light transition hover:bg-[rgba(13,11,97,0.08)] hover:text-brand-on-light"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex justify-center rounded-xl bg-brand-accent px-6 py-2.5 text-sm font-black text-brand-on-accent transition hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </form>
  );
}
