import {
  BadgePercent,
  CheckCircle,
  LayoutDashboard,
  MessageCircle,
  Search,
  ShieldCheck,
  Store,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

import LogoutButton from "@/components/layout/LogoutButton";
import { getDb } from "@/lib/db";
import { getCurrentUser, type CurrentUser } from "@/lib/session";
import { buildWhatsappUrl, resolveStoreWhatsappNumber } from "@/lib/whatsapp";

const fallbackCategories = [
  { name: "Laptop", slug: "laptop" },
  { name: "PC Rakitan", slug: "pc-rakitan" },
  { name: "Monitor", slug: "monitor" },
  { name: "Keyboard", slug: "keyboard" },
  { name: "Mouse", slug: "mouse" },
  { name: "Printer", slug: "printer" },
  { name: "Networking", slug: "networking" },
  { name: "CCTV", slug: "cctv" },
  { name: "Storage", slug: "storage" },
  { name: "Aksesoris", slug: "aksesoris" },
];

function logoHref(user: Pick<CurrentUser, "role" | "retailStatus"> | null) {
  if (!user) return "/";
  if (user.role === "SUPER_ADMIN") return "/super-admin";
  if (user.role === "ADMIN") return "/admin";
  return "/products";
}

function topAction(user: CurrentUser | null) {
  if (!user) return { href: "/login", label: "Login" };
  if (user.role === "SUPER_ADMIN") return { href: "/super-admin", label: "Super Admin" };
  if (user.role === "ADMIN") return { href: "/admin", label: "Dashboard Admin" };
  if (user.retailStatus === "RETAIL_ACTIVE") return { href: "/vouchers", label: "Voucher Ritel" };
  if (user.retailStatus === "PENDING_RETAIL") return { href: "/retail/activate", label: "Aktivasi Token" };
  return { href: "/retail/request-token", label: "Request Token" };
}

async function getHeaderCategories() {
  try {
    const db = getDb();
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, slug: true },
      take: 10,
    });

    if (categories.length > 0) return categories;
  } catch {
    // Fall back to static marketplace shortcuts when the database is unavailable.
  }

  return fallbackCategories;
}

async function getHeaderWhatsappUrl() {
  const message = "Halo Admin, saya ingin konsultasi produk komputer dan aksesoris dari katalog.";

  try {
    const db = getDb();
    const whatsappNumber = await resolveStoreWhatsappNumber(db);
    return buildWhatsappUrl({ message, whatsappNumber });
  } catch {
    return buildWhatsappUrl({ message });
  }
}

export default async function SiteHeader() {
  const [user, categories, whatsappUrl] = await Promise.all([
    getCurrentUser().catch(() => null),
    getHeaderCategories(),
    getHeaderWhatsappUrl(),
  ]);

  const role = user?.role;
  const retailStatus = user?.retailStatus;
  const logoHrefValue = logoHref(user);
  const roleAction = topAction(user);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-primary/20 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-brand-primary-dark to-brand-primary text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6">
          <div className="flex min-w-0 items-center gap-2 font-medium text-white/90">
            <ShieldCheck className="size-4 shrink-0 text-brand-accent" />
            <span className="truncate">Garansi toko dan dukungan WhatsApp</span>
          </div>
          <div className="hidden items-center gap-4 font-semibold sm:flex">
            <Link href="/vouchers" className="text-white/90 hover:text-white">
              Voucher
            </Link>
            <Link href="/products" className="text-white/90 hover:text-white">
              Katalog
            </Link>
            <Link href={roleAction.href} className="text-white hover:underline">
              {roleAction.label}
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center">
          <div className="flex items-center justify-between gap-3 lg:w-64">
            <Link href={logoHrefValue} className="group flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary-dark to-brand-secondary text-white shadow-sm">
                <Store className="size-5" />
              </span>
              <span>
                <span className="block text-base font-black leading-tight text-brand-primary sm:text-lg">
                  E-Katalog
                </span>
                <span className="block text-xs font-semibold text-brand-muted group-hover:text-brand-primary">
                  Komputer & Aksesoris
                </span>
              </span>
            </Link>
            {retailStatus === "RETAIL_ACTIVE" ? (
              <span className="rounded-full bg-brand-secondary/15 px-3 py-1 text-[11px] font-black text-brand-primary lg:hidden">
                Ritel
              </span>
            ) : null}
          </div>

          <form
            action="/products"
            className="flex flex-1 items-center rounded-2xl border border-brand-primary/20 bg-brand-bg px-3 py-2 shadow-inner transition focus-within:border-brand-primary focus-within:bg-white"
          >
            <Search className="mr-2 size-5 shrink-0 text-brand-primary" />
            <input
              aria-label="Cari produk"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-brand-muted"
              name="q"
              placeholder="Cari laptop, PC rakitan, monitor, printer..."
            />
            <button
              type="submit"
              className="rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white transition hover:bg-brand-hover"
            >
              Cari
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {role !== "ADMIN" && role !== "SUPER_ADMIN" ? (
              <>
                <a
                  href={whatsappUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-whatsapp-green px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-whatsapp-green/90 sm:px-4"
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
                <Link
                  href="/vouchers"
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-accent/30 bg-brand-accent/5 px-3 py-2 text-xs font-black text-brand-accent transition hover:border-brand-accent sm:px-4"
                >
                  <BadgePercent className="size-4" />
                  Voucher
                </Link>
              </>
            ) : null}

            {!user ? (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-brand-primary px-4 py-2 text-xs font-black text-brand-primary transition hover:bg-brand-primary hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white transition hover:bg-brand-hover"
                >
                  <UserPlus className="size-4" />
                  Daftar Ritel
                </Link>
              </>
            ) : role === "ADMIN" || role === "SUPER_ADMIN" ? (
              <>
                <Link
                  href={role === "SUPER_ADMIN" ? "/super-admin" : "/admin"}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white transition hover:bg-brand-hover"
                >
                  <LayoutDashboard className="size-4" />
                  {role === "SUPER_ADMIN" ? "Super Admin" : "Dashboard Admin"}
                </Link>
                <LogoutButton className="rounded-xl border border-danger px-4 py-2 text-xs font-black text-danger transition hover:bg-danger hover:text-white" />
              </>
            ) : retailStatus === "RETAIL_ACTIVE" ? (
              <>
                <span className="hidden items-center gap-2 rounded-xl bg-brand-secondary/15 px-3 py-2 text-xs font-black text-brand-primary sm:inline-flex">
                  <CheckCircle className="size-4 text-brand-secondary" />
                  Harga Ritel Aktif
                </span>
                <Link
                  href="/vouchers"
                  className="rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white transition hover:bg-brand-hover"
                >
                  Voucher Ritel
                </Link>
                <LogoutButton className="rounded-xl border border-danger px-4 py-2 text-xs font-black text-danger transition hover:bg-danger hover:text-white" />
              </>
            ) : retailStatus === "PENDING_RETAIL" ? (
              <>
                <Link
                  href="/retail/activate"
                  className="rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white transition hover:bg-brand-hover"
                >
                  Aktivasi Token
                </Link>
                <LogoutButton className="rounded-xl border border-danger px-4 py-2 text-xs font-black text-danger transition hover:bg-danger hover:text-white" />
              </>
            ) : (
              <>
                <Link
                  href="/retail/request-token"
                  className="rounded-xl bg-brand-primary px-4 py-2 text-xs font-black text-white transition hover:bg-brand-hover"
                >
                  Request Token
                </Link>
                <LogoutButton className="rounded-xl border border-danger px-4 py-2 text-xs font-black text-danger transition hover:bg-danger hover:text-white" />
              </>
            )}
          </div>
        </div>

        <nav className="border-t border-brand-border bg-white">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 sm:px-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${encodeURIComponent(category.slug)}`}
                className="shrink-0 rounded-full border border-brand-border bg-brand-bg px-3 py-1.5 text-xs font-bold text-brand-muted transition hover:border-brand-primary hover:bg-brand-primary hover:text-white"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
