"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { signIn } from "@/lib/auth-client";

function isSafeCallbackUrl(url: string | null): boolean {
  if (!url) return false;
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  if (url.includes("http://") || url.includes("https://")) return false;
  return true;
}

function getRoleRedirect(
  role: string | null,
  retailStatus: string | null,
  callbackUrl: string | null,
): string {
  if (isSafeCallbackUrl(callbackUrl)) return callbackUrl!;

  if (role === "SUPER_ADMIN") return "/super-admin";
  if (role === "ADMIN") return "/admin";
  if (retailStatus === "RETAIL_ACTIVE") return "/products";
  if (retailStatus === "PENDING_RETAIL") return "/retail/activate";
  if (retailStatus === "REGISTERED") return "/retail/request-token";
  return "/";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await signIn.email({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (response.error) {
      setError(response.error.message ?? "Login gagal. Periksa email dan password.");
      setIsSubmitting(false);
      return;
    }

    try {
      const userRes = await fetch("/api/auth/current-user");
      if (!userRes.ok) {
        router.replace("/");
        router.refresh();
        return;
      }
      const user = await userRes.json();
      const target = getRoleRedirect(user.role, user.retailStatus, callbackUrl);
      router.replace(target);
      router.refresh();
    } catch {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
      <Link href="/" className="text-sm font-semibold text-brand-primary">
        E-Katalog Komputer
      </Link>
      <h1 className="mt-6 text-2xl font-bold">Retail Login</h1>
      <p className="mt-2 text-sm text-brand-muted">
        Masuk untuk mengelola akun dan melihat akses retail jika sudah aktif.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-semibold" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-xl border border-brand-border px-3 py-3 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            className="mt-2 w-full rounded-xl border border-brand-border px-3 py-3 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Memproses..." : "Login"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-brand-muted">
        Belum punya akun?{" "}
        <Link className="font-semibold text-brand-accent" href="/register">
          Daftar retail
        </Link>
      </p>
    </section>
  );
}

function AuthHeader() {
  return (
    <header
      className="sticky top-0 z-50 shadow-sm"
      style={{
        background:
          "linear-gradient(135deg, var(--brand-primary-dark) 0%, var(--brand-primary) 100%)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center px-4 py-3 md:px-6">
        <Link href="/" className="flex-shrink-0 select-none">
          <span className="text-xl font-black tracking-tight text-white md:text-2xl">
            E-<span className="text-brand-accent">Katalog</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-3 text-xs text-white/70">
          <Link href="/vouchers" className="transition-colors hover:text-white">Voucher</Link>
          <span className="opacity-40">|</span>
          <Link href="/products" className="transition-colors hover:text-white">Katalog</Link>
        </div>
      </div>
    </header>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <AuthHeader />
      <div className="px-4 py-10">
        <Suspense fallback={<div className="text-center pt-10 text-brand-muted">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
