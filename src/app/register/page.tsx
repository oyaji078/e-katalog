"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  checkRegistrationEnabled,
  registerUserAction,
} from "./actions";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; name: string; whatsappNumber: string; storeName: string; userCode?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationDisabled, setRegistrationDisabled] = useState(false);

  useEffect(() => {
    checkRegistrationEnabled().then((enabled) => {
      if (!enabled) setRegistrationDisabled(true);
    });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
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
    event.currentTarget.reset();
  }

  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <section className="mx-auto max-w-2xl rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary-maroon">
          E-Katalog Komputer
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Daftar Akun Retail</h1>
        <p className="mt-2 text-sm text-text-muted">
          Setelah akun dibuat, kamu dapat meminta token aktivasi retail melalui WhatsApp.
        </p>

        {registrationDisabled ? (
          <div className="mt-6 rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <p className="font-semibold text-warning">Registrasi retail saat ini ditutup.</p>
            <p className="mt-2 text-sm text-text-muted">
              Pendaftaran akun retail belum tersedia. Silakan hubungi admin untuk informasi lebih
              lanjut.
            </p>
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 rounded-2xl border border-success/30 bg-success/5 p-4">
            <p className="font-semibold text-success">Akun berhasil dibuat!</p>
            <p className="mt-2 text-sm text-text-muted">
              Untuk mengaktifkan akses retail, minta token aktivasi ke admin melalui WhatsApp.
            </p>
            <Link
              href="/retail/request-token"
              className="mt-4 inline-flex rounded-xl bg-whatsapp-green px-4 py-3 text-sm font-bold text-white"
            >
              Minta Token Retail via WhatsApp
            </Link>
          </div>
        ) : null}

        {!registrationDisabled && !result ? (
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} key="register-form">
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold" htmlFor="name">
              Nama lengkap *
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-2 w-full rounded-xl border border-border-gray px-3 py-3 text-sm outline-none focus:border-primary-maroon"
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-border-gray px-3 py-3 text-sm outline-none focus:border-primary-maroon"
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="whatsappNumber">
              Nomor WhatsApp *
            </label>
            <input
              id="whatsappNumber"
              name="whatsappNumber"
              required
              className="mt-2 w-full rounded-xl border border-border-gray px-3 py-3 text-sm outline-none focus:border-primary-maroon"
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="password">
              Password *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              className="mt-2 w-full rounded-xl border border-border-gray px-3 py-3 text-sm outline-none focus:border-primary-maroon"
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="confirmPassword">
              Konfirmasi password *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              className="mt-2 w-full rounded-xl border border-border-gray px-3 py-3 text-sm outline-none focus:border-primary-maroon"
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="storeName">
              Nama toko / instansi
            </label>
            <input
              id="storeName"
              name="storeName"
              className="mt-2 w-full rounded-xl border border-border-gray px-3 py-3 text-sm outline-none focus:border-primary-maroon"
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="address">
              Alamat
            </label>
            <input
              id="address"
              name="address"
              className="mt-2 w-full rounded-xl border border-border-gray px-3 py-3 text-sm outline-none focus:border-primary-maroon"
            />
          </div>

          {error ? <p className="text-sm text-danger sm:col-span-2">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-primary-maroon px-4 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2"
          >
            {isSubmitting ? "Memproses..." : "Buat Akun"}
          </button>
        </form>
        ) : null}
      </section>
    </main>
  );
}
