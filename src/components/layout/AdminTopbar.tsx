"use client";

import { ChevronDown, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { signOut } from "@/lib/auth-client";

type AdminTopbarProps = {
  user: {
    name: string | null;
    email: string | null;
    role: string | null;
  };
};

const titleMap: Array<[RegExp, string]> = [
  [/^\/admin\/products/, "Produk"],
  [/^\/admin\/categories/, "Kategori"],
  [/^\/admin\/brands/, "Merek"],
  [/^\/admin\/vouchers/, "Voucher"],
  [/^\/admin\/promo-banners/, "Promo Banner"],
  [/^\/admin\/flash-sale/, "Flash Sale"],
  [/^\/admin\/flash-sales/, "Flash Sale"],
  [/^\/admin\/promo-vouchers/, "Promo & Voucher"],
  [/^\/admin\/hero-banners/, "Hero Banner"],
  [/^\/admin\/generate-token/, "Generate Token"],
  [/^\/admin\/retail-users/, "Pengguna Ritel"],
  [/^\/admin\/reports/, "Laporan"],
  [/^\/admin\/store-settings/, "Pengaturan Toko"],
  [/^\/admin\/inquiries/, "Inquiry WhatsApp"],
  [/^\/super-admin\/system/, "System"],
  [/^\/super-admin\/feature-flags/, "Feature Flags"],
  [/^\/super-admin\/admin-users/, "Admin Users"],
  [/^\/super-admin\/deployment/, "Deployment"],
  [/^\/super-admin\/environment/, "Environment"],
  [/^\/super-admin\/maintenance/, "Maintenance"],
  [/^\/super-admin\/roles/, "Roles"],
  [/^\/super-admin\/security/, "Security"],
  [/^\/super-admin\/system-logs/, "System Logs"],
  [/^\/super-admin/, "Super Admin"],
  [/^\/admin/, "Dashboard"],
];

export default function AdminTopbar({ user }: AdminTopbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pageTitle = useMemo(() => resolveTitle(pathname), [pathname]);
  const roleBadge = user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin";
  const displayName = user.name || user.email || "Admin";
  const initials = getInitials(displayName);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
    // Full reload resets all session state and avoids the router
    // "dispatched before initialization" timing issue on auth flows.
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white shadow-sm">
      <div className="flex h-[58px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-page)] hover:text-[var(--color-text)] lg:hidden"
            aria-label="Buka menu admin"
            onClick={() => window.dispatchEvent(new CustomEvent("admin-mobile-menu-open"))}
          >
            <Menu size={20} />
          </button>
          <h1 className="truncate text-[17px] font-semibold text-[var(--color-text)]">
            {pageTitle}
          </h1>
        </div>

        <div ref={ref} className="relative flex shrink-0 items-center gap-2.5">
          <span
            className="hidden rounded-full border px-3 py-1 text-[11px] font-semibold sm:inline-flex"
            style={{ background: "#EFF6FF", color: "#1D4ED8", borderColor: "#BFDBFE" }}
          >
            {roleBadge}
          </span>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white p-1.5 pr-2 text-left transition hover:border-[var(--color-accent)]"
            aria-expanded={open}
            aria-label="Menu akun"
          >
            <span
              className="flex size-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)" }}
            >
              {initials}
            </span>
            <ChevronDown className="size-4 text-[var(--color-text-muted)]" />
          </button>

          {open ? (
            <div className="absolute right-0 top-12 z-50 min-w-56 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-xl">
              <div className="border-b border-[var(--color-border)] px-4 py-3">
                <p className="truncate text-sm font-semibold text-[var(--color-text)]">{displayName}</p>
                {user.email ? (
                  <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">{user.email}</p>
                ) : null}
              </div>
              <div className="p-2">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] transition hover:bg-[var(--color-page)] hover:text-[var(--color-text)]"
                >
                  Lihat Toko
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--color-danger)] transition hover:bg-red-50 disabled:opacity-60"
                >
                  {loggingOut ? "Keluar..." : "Keluar"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function resolveTitle(pathname: string) {
  return titleMap.find(([pattern]) => pattern.test(pathname))?.[1] ?? "Dashboard";
}

function getInitials(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "AD";
}
