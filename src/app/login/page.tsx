"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
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
      callbackURL: "/",
    });

    setIsSubmitting(false);

    if (response.error) {
      setError(response.error.message ?? "Login gagal. Periksa email dan password.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-soft-bg px-4 py-10 text-text-dark">
      <section className="mx-auto max-w-md rounded-2xl border border-border-gray bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary-maroon">
          E-Katalog Komputer
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Retail Login</h1>
        <p className="mt-2 text-sm text-text-muted">
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
              className="mt-2 w-full rounded-xl border border-border-gray px-3 py-3 text-sm outline-none focus:border-primary-maroon"
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
              className="mt-2 w-full rounded-xl border border-border-gray px-3 py-3 text-sm outline-none focus:border-primary-maroon"
            />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary-maroon px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Memproses..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-muted">
          Belum punya akun?{" "}
          <Link className="font-semibold text-accent-rose" href="/register">
            Daftar retail
          </Link>
        </p>
      </section>
    </main>
  );
}
