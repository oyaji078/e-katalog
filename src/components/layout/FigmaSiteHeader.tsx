import {
  Bookmark,
  Grid3X3,
  Home,
  LayoutDashboard,
  MessageCircle,
  Search,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { headers } from "next/headers";

import LogoutButton from "@/components/layout/LogoutButton";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getCurrentUser, type CurrentUser } from "@/lib/session";
import {
  getPublicSiteSettings,
  type PublicSiteSettings,
} from "@/lib/site-settings";
import { buildWhatsappUrl } from "@/lib/whatsapp";

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

const desktopLinks = [
  { label: "Beranda", href: "/", icon: Home },
  { label: "Katalog", href: "/products", icon: Grid3X3 },
  { label: "Kategori", href: "/products#kategori", icon: Grid3X3 },
  { label: "Tersimpan", href: "/produk-tersimpan", icon: Bookmark },
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

function getWhatsappUrl(settings: PublicSiteSettings) {
  return buildWhatsappUrl({
    message: "Halo Admin, saya ingin konsultasi produk komputer dan aksesoris dari katalog.",
    whatsappNumber: settings.whatsappNumber,
  });
}

function isActivePath(pathname: string, href: string) {
  const path = href.split("#")[0] || "/";
  if (href.includes("#")) return false;
  if (path === "/") return pathname === "/";
  return pathname.startsWith(path);
}

type FigmaSiteHeaderProps = {
  showCategoryNav?: boolean;
};

export default async function FigmaSiteHeader({ showCategoryNav = true }: FigmaSiteHeaderProps = {}) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "/";
  const [user, categories, settings, publicVoucherEnabled, retailVoucherEnabled] = await Promise.all([
    getCurrentUser().catch(() => null),
    showCategoryNav ? getHeaderCategories() : Promise.resolve([]),
    getPublicSiteSettings(),
    isFeatureEnabled("enable_public_voucher"),
    isFeatureEnabled("enable_retail_voucher"),
  ]);
  const whatsappUrl = getWhatsappUrl(settings);
  const publicAccent = settings.accentColor;

  const role = user?.role;
  const retailStatus = user?.retailStatus;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const voucherEnabled = retailStatus === "RETAIL_ACTIVE" ? retailVoucherEnabled : publicVoucherEnabled;
  const visibleDesktopLinks = desktopLinks.filter((link) => link.href !== "/vouchers" || voucherEnabled);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[var(--public-border)] bg-[var(--public-base)] text-[var(--public-text)] shadow-[0_4px_20px_rgba(228,211,41,0.12)] backdrop-blur-xl"
      style={{
        "--public-base": settings.primaryColor,
        "--public-surface": settings.secondaryColor,
        "--public-accent": publicAccent,
        "--public-text": settings.textColor,
        "--public-muted": settings.mutedColor,
        "--public-border": "rgba(255,255,255,0.14)",
      } as CSSProperties}
    >
      <PublicAnnouncementBar settings={settings} />

      <div className="mx-auto hidden h-16 max-w-screen-2xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 overflow-x-hidden px-6 md:grid">
        <BrandMark settings={settings} href={logoHref(user)} />

        <nav className="hidden min-w-0 items-center justify-center gap-1 lg:flex">
          {visibleDesktopLinks.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
            <Link
              key={link.label}
              href={link.href}
              className={`group inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors xl:text-[11px] ${
                active
                  ? "text-[var(--public-accent)]"
                  : "text-[var(--public-muted)] hover:text-[var(--public-accent)]"
              }`}
            >
              {active ? (
                <span className="size-1.5 rounded-full bg-[var(--public-accent)]" />
              ) : null}
              {link.label}
            </Link>
          );
          })}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-3">
          <form action="/products" className="hidden w-[300px] flex-shrink-0 lg:block xl:w-[380px] 2xl:w-[420px]">
            <div className="relative">
              <input
                type="text"
                name="search"
                placeholder="Cari produk..."
                className="w-full min-w-0 rounded-none border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] py-2 pl-3 pr-10 text-xs font-semibold text-[var(--public-text)] outline-none placeholder:text-[var(--public-muted)] transition focus:border-[var(--public-accent)]"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-[var(--public-muted)] transition-colors hover:text-[var(--public-accent)]"
                aria-label="Cari produk"
              >
                <Search size={15} />
              </button>
            </div>
          </form>

          <DesktopHeaderIcons
            user={user}
            isAdmin={isAdmin}
            role={role}
            retailStatus={retailStatus}
            whatsappUrl={whatsappUrl}
          />
        </div>
      </div>

      <div className="mx-auto max-w-full px-4 py-2 md:hidden">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <BrandMark settings={settings} href={logoHref(user)} compact />
          <MobileHeaderIcons
            user={user}
            isAdmin={isAdmin}
            role={role}
            whatsappUrl={whatsappUrl}
          />
        </div>
        <form action="/products" className="mt-2 max-w-full overflow-hidden">
          <div className="relative">
            <input
              type="text"
              name="search"
              placeholder="Cari laptop, printer, aksesoris..."
              className="w-full min-w-0 rounded-none border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] py-2 pl-9 pr-3 text-xs font-semibold text-[var(--public-text)] outline-none placeholder:text-[var(--public-muted)] focus:border-[var(--public-accent)]"
            />
            <button
              type="submit"
              className="absolute left-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-[var(--public-muted)]"
              aria-label="Cari produk"
            >
              <Search size={13} />
            </button>
          </div>
        </form>
      </div>

      {showCategoryNav ? (
        <div className="border-t border-[var(--public-border)]">
          <div className="mx-auto flex max-w-[1400px] items-center gap-0 overflow-x-auto px-4 [scrollbar-width:none] lg:px-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${encodeURIComponent(category.slug)}`}
                className="relative flex-shrink-0 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--public-muted)] transition-colors hover:text-[var(--public-accent)] md:text-[11px]"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function PublicAnnouncementBar({ settings }: { settings: PublicSiteSettings }) {
  if (!settings.announcementEnabled || !settings.announcementText.trim()) return null;

  const messages = settings.announcementText
    .split(/\s*(?:\||•)\s*/g)
    .map((message) => message.trim())
    .filter(Boolean)
    .filter((message) => !/(shipping|pengiriman|ongkir|checkout|order|pesanan|tracking|lacak)/i.test(message));
  const renderedMessages =
    messages.length > 0
      ? messages
      : ["Katalog komputer dan aksesoris premium - cek stok via WhatsApp"];
  const content = (
    <div
      className="public-announcement-track flex whitespace-nowrap"
      style={{ "--announcement-duration": `${settings.announcementSpeed}s` } as CSSProperties}
    >
      {[...renderedMessages, ...renderedMessages].map((message, index) => (
        <span
          key={`${message}-${index}`}
          className="inline-block px-8 text-[10px] font-black uppercase tracking-[0.24em] text-[#0D0B61] md:px-12 md:text-xs"
        >
          {message}
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden bg-[#E4D329] py-2 text-[#0D0B61]">
      {settings.announcementLink ? (
        <Link href={settings.announcementLink} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

function BrandMark({
  settings,
  href,
  compact = false,
}: {
  settings: PublicSiteSettings;
  href: string;
  compact?: boolean;
}) {
  const initial = settings.storeName.trim().charAt(0).toUpperCase() || "R";

  return (
    <Link href={href} className="min-w-0 flex-shrink-0 select-none">
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`flex shrink-0 rotate-45 items-center justify-center bg-[var(--public-accent)] transition-transform duration-300 hover:rotate-0 ${
            compact ? "size-7" : "size-9"
          }`}
        >
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt={settings.storeName}
              className="-rotate-45 size-full object-contain p-1 transition-transform duration-300 hover:rotate-0"
            />
          ) : (
            <span
              className={`-rotate-45 font-black text-brand-accent-text transition-transform duration-300 hover:rotate-0 ${
                compact ? "text-[10px]" : "text-xs"
              }`}
            >
              {initial}
            </span>
          )}
        </span>
        <span
          className={`min-w-0 truncate font-black uppercase tracking-[0.18em] text-[var(--public-text)] ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {settings.storeName}
        </span>
      </span>
    </Link>
  );
}

function DesktopHeaderIcons({
  user,
  isAdmin,
  role,
  retailStatus,
  whatsappUrl,
}: {
  user: { role: string | null; retailStatus: string | null; id?: string; name?: string | null; email?: string | null } | null;
  isAdmin: boolean;
  role: string | null | undefined;
  retailStatus: string | null | undefined;
  whatsappUrl: string;
}) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3 text-[var(--public-text)]">
      {!isAdmin ? (
        <>
          <Link
            href="/produk-tersimpan"
            className="text-[var(--public-muted)] transition-colors hover:text-[var(--public-accent)]"
            aria-label="Produk tersimpan"
          >
            <Bookmark size={19} />
          </Link>
          <a
            href={whatsappUrl}
            className="text-[var(--public-muted)] transition-colors hover:text-[var(--public-accent)]"
            aria-label="WhatsApp"
          >
            <MessageCircle size={20} />
          </a>
        </>
      ) : null}

      {!user ? (
        <>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)] transition-colors hover:border-[var(--public-accent)] hover:text-[var(--public-text)]"
          >
            <User size={13} />
            Masuk
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 bg-[var(--public-accent)] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-brand-on-accent transition-colors hover:bg-brand-accent-hover"
          >
            <UserPlus size={13} />
            Ritel
          </Link>
        </>
      ) : isAdmin ? (
        <>
          <Link
            href={role === "SUPER_ADMIN" ? "/super-admin" : "/admin"}
            className="inline-flex items-center gap-1.5 border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)] transition-colors hover:border-[var(--public-accent)] hover:text-[var(--public-accent)]"
          >
            <LayoutDashboard size={13} />
            {role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
          </Link>
          <LogoutButton className="border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]" />
        </>
      ) : retailStatus === "RETAIL_ACTIVE" ? (
        <>
          <span className="border border-[var(--public-accent)]/40 bg-[var(--public-accent)]/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--public-accent)]">
            Ritel Aktif
          </span>
          <LogoutButton className="border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]" />
        </>
      ) : retailStatus === "PENDING_RETAIL" ? (
        <>
          <Link
            href="/retail/activate"
            className="border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)] transition-colors hover:border-[var(--public-accent)] hover:text-[var(--public-accent)]"
          >
            Aktivasi
          </Link>
          <LogoutButton className="border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]" />
        </>
      ) : (
        <>
          <Link
            href="/retail/request-token"
            className="border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)] transition-colors hover:border-[var(--public-accent)] hover:text-[var(--public-accent)]"
          >
            Token Ritel
          </Link>
          <LogoutButton className="border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--public-muted)]" />
        </>
      )}
    </div>
  );
}

function MobileHeaderIcons({
  user,
  isAdmin,
  role,
  whatsappUrl,
}: {
  user: { role: string | null; retailStatus: string | null; id?: string; name?: string | null; email?: string | null } | null;
  isAdmin: boolean;
  role: string | null | undefined;
  whatsappUrl: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 text-[var(--public-text)]">
      {!isAdmin ? (
        <a
          href={whatsappUrl}
          className="flex size-8 items-center justify-center border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] text-[var(--public-muted)] transition-colors hover:border-[var(--public-accent)] hover:text-[var(--public-accent)]"
          aria-label="WhatsApp"
        >
          <MessageCircle size={15} />
        </a>
      ) : null}

      {!user ? (
        <Link
          href="/login"
          className="flex size-8 items-center justify-center border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] text-[var(--public-muted)] transition-colors hover:text-[var(--public-accent)]"
          aria-label="Masuk"
        >
          <User size={15} />
        </Link>
      ) : isAdmin ? (
        <Link
          href={role === "SUPER_ADMIN" ? "/super-admin" : "/admin"}
          className="flex size-8 items-center justify-center border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] text-[var(--public-muted)] transition-colors hover:text-[var(--public-accent)]"
          aria-label={role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
        >
          <LayoutDashboard size={15} />
        </Link>
      ) : (
        <LogoutButton
          className="flex size-8 items-center justify-center border border-[var(--public-border)] bg-[var(--public-card,rgba(255,255,255,0.06))] text-[var(--public-muted)] transition-colors hover:text-[var(--public-accent)] disabled:opacity-60"
          iconOnly
        />
      )}
    </div>
  );
}
