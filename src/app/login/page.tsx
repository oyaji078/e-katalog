"use client";

import { Suspense, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { signIn } from "@/lib/auth-client";

export const dynamic = "force-dynamic";

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
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    // Use a full reload for the post-login redirect: session state has just
    // changed, and window.location avoids the router init timing issue.
    try {
      const userRes = await fetch("/api/auth/current-user");
      if (!userRes.ok) {
        window.location.href = "/";
        return;
      }
      const user = await userRes.json();
      window.location.href = getRoleRedirect(user.role, user.retailStatus, callbackUrl);
    } catch {
      window.location.href = "/";
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-brand-border-light bg-white p-6 text-slate-900 shadow-2xl shadow-black/25 sm:p-8">
      <Link href="/" className="text-base font-black tracking-tight text-brand-primary">
        RAMA COMPUTER
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-slate-950">Retail Login</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Masuk untuk mengelola akun dan melihat akses retail jika sudah aktif.
      </p>

      <form className="mt-6 space-y-4" method="post" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="email">
            Email
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
          <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              minLength={8}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-brand-border-light bg-slate-50 px-4 py-3 pr-11 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand-primary px-4 py-3 text-base font-bold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Memproses..." : "Login"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <Link className="font-semibold text-brand-primary transition hover:text-brand-primary-dark" href="/register">
          Daftar retail
        </Link>
      </p>
    </section>
  );
}

function AuthHeader() {
  return (
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
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-slate-950">
      <AuthHeader />
      <div className="flex min-h-[calc(100dvh-56px)] items-center justify-center px-4 py-8 sm:py-10">
        <Suspense fallback={<div className="pt-10 text-center text-sm text-white/70">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
