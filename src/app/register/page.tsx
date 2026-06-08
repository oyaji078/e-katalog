"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LocateFixed } from "lucide-react";

import {
  checkRegistrationEnabled,
  registerUserAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; name: string; whatsappNumber: string; storeName: string; userCode?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationDisabled, setRegistrationDisabled] = useState(false);
  const [address, setAddress] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState("");

  useEffect(() => {
    checkRegistrationEnabled().then((enabled) => {
      if (!enabled) setRegistrationDisabled(true);
    });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    setIsSubmitting(true);

    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const whatsappNumber = String(formData.get("whatsappNumber") ?? "");
    const storeName = String(formData.get("storeName") ?? "");

    const state = await registerUserAction(formData);

    setIsSubmitting(false);

    if (!state.success) {
      setError(state.error ?? "Registrasi gagal.");
      return;
    }

    setResult({ email, name, whatsappNumber, storeName, userCode: state.userCode });
    setAddress("");
    form.reset();
  }

  function handleUseCurrentLocation() {
    setLocationMessage("");

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationMessage("Browser tidak mendukung ambil lokasi.");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        const coordinateText = `Lokasi: ${latitude}, ${longitude}`;
        setAddress((current) => {
          const cleaned = current.trim();
          return cleaned ? `${cleaned} | ${coordinateText}` : coordinateText;
        });
        setLocationStatus("success");
        setLocationMessage("Lokasi berhasil ditambahkan.");
      },
      () => {
        setLocationStatus("error");
        setLocationMessage("Tidak dapat mengambil lokasi. Periksa izin lokasi browser.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg text-slate-950">
      <header
        className="sticky top-0 z-50 border-b border-white/10 shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-primary-dark) 0%, var(--brand-primary) 100%)",
        }}
      >
        <div className="mx-auto flex min-h-14 max-w-7xl items-center px-4 py-3 md:px-6">
          <Link href="/" className="flex-shrink-0 select-none">
            <span className="text-xl font-black tracking-tight text-white md:text-2xl">
              RAMA <span className="text-brand-accent">COMPUTER</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3 text-xs text-white/70">
            <Link href="/vouchers" className="transition-colors hover:text-white">Voucher</Link>
            <span className="opacity-40">|</span>
            <Link href="/products" className="transition-colors hover:text-white">Katalog</Link>
          </div>
        </div>
      </header>
      <div className="px-4 py-6 sm:py-8">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-brand-border-light bg-white p-5 text-slate-900 shadow-2xl shadow-black/25 sm:p-6 lg:p-7">
        <Link href="/" className="text-base font-black tracking-tight text-brand-primary">
          RAMA COMPUTER
        </Link>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">Daftar Akun Retail</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Setelah akun dibuat, kamu dapat meminta OTP aktivasi retail melalui WhatsApp.
        </p>

        {registrationDisabled ? (
          <div className="mt-6 rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="font-semibold text-warning">Registrasi retail saat ini ditutup.</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pendaftaran akun retail belum tersedia. Silakan hubungi admin untuk informasi lebih
              lanjut.
            </p>
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 rounded-2xl border border-success/30 bg-success/5 p-4">
            <p className="font-semibold text-success">Akun berhasil dibuat!</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Untuk mengaktifkan akses retail, minta OTP aktivasi ke admin melalui WhatsApp.
            </p>
            <div className="mt-4 space-y-3">
              <Link
                href="/retail/request-token"
                className="flex items-center justify-center rounded-xl bg-whatsapp-green px-4 py-3 text-sm font-bold text-white"
              >
                Minta Token Retail via WhatsApp
              </Link>
              <Link
                href="/retail/activate"
                className="flex items-center justify-center rounded-xl border border-brand-primary px-4 py-3 text-sm font-semibold text-brand-primary"
              >
                Jika sudah punya token, aktifkan akun ritel
              </Link>
            </div>
          </div>
        ) : null}

        {!registrationDisabled && !result ? (
        <form className="mt-6 grid gap-x-4 gap-y-3 sm:grid-cols-2" onSubmit={handleSubmit} key="register-form">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="name">
              Nama lengkap *
            </label>
            <input
              id="name"
              name="name"
              required
              autoComplete="name"
              className="mt-2 w-full rounded-xl border border-brand-border-light bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-brand-border-light bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="whatsappNumber">
              Nomor WhatsApp *
            </label>
            <input
              id="whatsappNumber"
              name="whatsappNumber"
              required
              autoComplete="tel"
              className="mt-2 w-full rounded-xl border border-brand-border-light bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
              Password *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-brand-border-light bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="confirmPassword">
              Konfirmasi password *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-brand-border-light bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="storeName">
              Nama toko / instansi
            </label>
            <input
              id="storeName"
              name="storeName"
              autoComplete="organization"
              className="mt-2 w-full rounded-xl border border-brand-border-light bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="address">
                Alamat
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locationStatus === "loading"}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-brand-primary px-3 text-sm font-bold text-brand-primary transition hover:bg-brand-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LocateFixed size={16} />
                {locationStatus === "loading" ? "Mengambil lokasi..." : "Ambil Lokasi Saat Ini"}
              </button>
            </div>
            <textarea
              id="address"
              name="address"
              autoComplete="street-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-brand-border-light bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:bg-white"
            />
            {locationMessage ? (
              <p className={`mt-2 text-xs font-semibold ${locationStatus === "error" ? "text-danger" : "text-success"}`}>
                {locationMessage}
              </p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-danger sm:col-span-2">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-brand-primary px-4 py-3 text-base font-bold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
          >
            {isSubmitting ? "Memproses..." : "Buat Akun"}
          </button>
        </form>
        ) : null}
      </section>
      </div>
    </main>
  );
}
