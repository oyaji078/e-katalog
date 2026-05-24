import {
  Bell,
  LayoutDashboard,
  MessageCircle,
  Search,
  Tag,
  User,
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
];

function logoHref(user: Pick<CurrentUser, "role" | "retailStatus"> | null) {
  if (!user) return "/";
  if (user.role === "SUPER_ADMIN") return "/super-admin";
  if (user.role === "ADMIN") return "/admin";
  return "/products";
}

async function getHeaderCategories() {
  try {
    const db = getDb();
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, slug: true },
      take: 9,
    });

    if (categories.length > 0) return categories;
  } catch {
    // Use static visual shortcuts if database categories are unavailable.
  }

  return fallbackCategories;
}

async function getWhatsappUrl() {
  const message = "Halo Admin, saya ingin konsultasi produk komputer dan aksesoris dari katalog.";

  try {
    const db = getDb();
    return buildWhatsappUrl({
      message,
      whatsappNumber: await resolveStoreWhatsappNumber(db),
    });
  } catch {
    return buildWhatsappUrl({ message });
  }
}

export default async function FigmaSiteHeader() {
  const [user, categories, whatsappUrl] = await Promise.all([
    getCurrentUser().catch(() => null),
    getHeaderCategories(),
    getWhatsappUrl(),
  ]);

  const role = user?.role;
  const retailStatus = user?.retailStatus;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  return (
    <header
      className="sticky top-0 z-50 shadow-sm"
      style={{ background: "linear-gradient(135deg, #6E1A37 0%, #AE2448 100%)" }}
    >
      <div className="mx-auto hidden max-w-7xl items-center justify-between border-b border-white/10 px-4 py-1 text-[11px] text-white/70 md:flex lg:px-6">
        <span>Garansi toko dan dukungan WhatsApp untuk produk komputer.</span>
        <div className="flex items-center gap-3">
          <Link href="/vouchers" className="transition-colors hover:text-white">
            Voucher
          </Link>
          <span className="opacity-40">|</span>
          <Link href="/products" className="transition-colors hover:text-white">
            Katalog
          </Link>
          <span className="opacity-40">|</span>
          {!user ? (
            <Link href="/login" className="transition-colors hover:text-white">
              Masuk
            </Link>
          ) : role === "SUPER_ADMIN" ? (
            <Link href="/super-admin" className="transition-colors hover:text-white">
              Super Admin
            </Link>
          ) : role === "ADMIN" ? (
            <Link href="/admin" className="transition-colors hover:text-white">
              Dashboard Admin
            </Link>
          ) : retailStatus === "PENDING_RETAIL" ? (
            <Link href="/retail/activate" className="transition-colors hover:text-white">
              Aktivasi Token
            </Link>
          ) : retailStatus === "RETAIL_ACTIVE" ? (
            <Link href="/vouchers" className="transition-colors hover:text-white">
              Voucher Ritel
            </Link>
          ) : (
            <Link href="/retail/request-token" className="transition-colors hover:text-white">
              Request Token
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
        <Link href={logoHref(user)} className="flex-shrink-0 select-none">
          <span className="text-xl font-black tracking-tight text-white md:text-2xl">
            E-<span style={{ color: "#D5E7B5" }}>Katalog</span>
          </span>
        </Link>

        <form action="/products" className="max-w-2xl flex-1">
          <div className="relative">
            <input
              type="text"
              name="q"
              placeholder="Cari laptop, monitor, printer, atau aksesoris..."
              className="w-full rounded-full bg-white py-2.5 pl-4 pr-11 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#D5E7B5]/60"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#6E1A37" }}
              aria-label="Cari produk"
            >
              <Search size={15} />
            </button>
          </div>
        </form>

        <div className="flex flex-shrink-0 items-center gap-3 text-white">
          {!isAdmin ? (
            <>
              <Link
                href="/vouchers"
                className="relative hidden transition-colors hover:text-[#D5E7B5] md:block"
                aria-label="Voucher"
              >
                <Tag size={22} />
                <span
                  className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full text-[10px] font-black"
                  style={{ backgroundColor: "#72BAA9" }}
                >
                  %
                </span>
              </Link>
              <a
                href={whatsappUrl}
                className="relative transition-colors hover:text-[#D5E7B5]"
                aria-label="WhatsApp"
              >
                <MessageCircle size={22} />
              </a>
            </>
          ) : (
            <Bell size={22} className="hidden md:block" />
          )}

          {!user ? (
            <>
              <Link
                href="/login"
                className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/20 md:flex"
              >
                <User size={14} />
                Masuk
              </Link>
              <Link
                href="/register"
                className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-black text-primary-maroon transition-transform hover:scale-105 lg:flex"
              >
                <UserPlus size={14} />
                Daftar Ritel
              </Link>
            </>
          ) : isAdmin ? (
            <>
              <Link
                href={role === "SUPER_ADMIN" ? "/super-admin" : "/admin"}
                className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/20 md:flex"
              >
                <LayoutDashboard size={14} />
                {role === "SUPER_ADMIN" ? "Super Admin" : "Dashboard Admin"}
              </Link>
              <LogoutButton className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-primary-maroon" />
            </>
          ) : retailStatus === "RETAIL_ACTIVE" ? (
            <>
              <span className="hidden rounded-full bg-[#D5E7B5] px-3 py-1.5 text-xs font-black text-primary-maroon md:inline-flex">
                Harga Ritel Aktif
              </span>
              <LogoutButton className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-primary-maroon" />
            </>
          ) : retailStatus === "PENDING_RETAIL" ? (
            <>
              <Link
                href="/retail/activate"
                className="hidden rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/20 md:inline-flex"
              >
                Aktivasi Token
              </Link>
              <LogoutButton className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-primary-maroon" />
            </>
          ) : (
            <>
              <Link
                href="/retail/request-token"
                className="hidden rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/20 md:inline-flex"
              >
                Request Token
              </Link>
              <LogoutButton className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-primary-maroon" />
            </>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-0.5 overflow-x-auto px-4 pb-2 lg:px-6 [scrollbar-width:none] md:hidden">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/products?category=${encodeURIComponent(category.slug)}`}
            className="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white/85 whitespace-nowrap transition-all hover:bg-[#D5E7B5] hover:text-primary-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            {category.name}
          </Link>
        ))}
      </div>
      <div className="mx-auto hidden max-w-7xl items-center gap-0.5 overflow-x-auto px-4 pb-2 md:flex lg:px-6">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/products?category=${encodeURIComponent(category.slug)}`}
            className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white/85 transition-all hover:bg-[#D5E7B5] hover:text-primary-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </header>
  );
}
