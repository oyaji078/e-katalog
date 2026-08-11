'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, BookmarkIcon, LogOut, ChevronDown, Grid3X3 } from 'lucide-react';
import type { CurrentUser } from '@/lib/session';
import { signOut } from '@/lib/auth-client';
import type { CSSProperties } from 'react';

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
};

type PublicNavbarProps = {
  whatsappUrl: string;
  session?: CurrentUser | null;
  announcementText?: string;
  announcementSpeed?: number;
  announcementLink?: string | null;
  topCategories?: CategoryItem[];
};

function isInternalPath(url: string) {
  return url.startsWith("/") && !url.startsWith("//");
}

function retailStatusBadge(status: string | null | undefined) {
  if (status === "RETAIL_ACTIVE") {
    return {
      label: "Ritel Aktif",
      background: "#F0FDF4",
      border: "#BBF7D0",
      color: "#166534",
    };
  }
  if (status === "PENDING_RETAIL") {
    return {
      label: "Aktivasi Ritel",
      background: "#FFFBEB",
      border: "#FDE68A",
      color: "#92400E",
    };
  }
  if (status === "REGISTERED") {
    return {
      label: "Token Ritel",
      background: "#EFF6FF",
      border: "#BFDBFE",
      color: "#1D4ED8",
    };
  }
  return null;
}

export default function PublicNavbar({
  whatsappUrl,
  session,
  announcementText = "Katalog komputer & aksesoris - tanya harga via WhatsApp",
  announcementSpeed = 30,
  announcementLink = null,
  topCategories = [],
}: PublicNavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [resolvedSession, setResolvedSession] = useState<CurrentUser | null | undefined>(undefined);

  // Only refresh session once on mount if no session was provided server-side.
  // Removed focus/pageshow listeners — they caused redundant network calls on
  // every tab switch or bfcache restore, hammering /api/auth/current-user.
  useEffect(() => {
    if (session !== undefined) return;
    let active = true;

    async function refreshSession() {
      try {
        const response = await fetch("/api/auth/current-user", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!active) return;
        const body = (await response.json()) as { user: CurrentUser | null };
        setResolvedSession(body.user ?? null);
      } catch {
        if (active) setResolvedSession(null);
      }
    }

    refreshSession();

    return () => {
      active = false;
    };
  }, [session]);

  // Close dropdowns on outside click or Escape key.  Both dropdown container
  // divs call stopPropagation so the opener buttons and menus themselves don't
  // trigger the click handler.
  useEffect(() => {
    function handleOutsideClick() {
      setIsUserMenuOpen(false);
      setIsCategoryMenuOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsCategoryMenuOpen(false);
      }
    }
    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    window.location.href = '/login';
  }

  const normalizedAnnouncement = announcementText.trim();
  const user = resolvedSession === undefined ? session ?? null : resolvedSession;
  const retailBadge = user ? retailStatusBadge(user.retailStatus) : null;
  const accountHref = user?.retailStatus === "PENDING_RETAIL"
    ? "/retail/activate"
    : user?.retailStatus === "REGISTERED"
      ? "/retail/request-token"
      : "/produk-tersimpan";

  return (
    <>
      {/* Announcement Bar */}
      {normalizedAnnouncement ? (
        <div
          className="w-full overflow-hidden"
          style={{
            background: 'var(--color-brand)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '9px 0',
          }}
        >
          <div
            className="public-announcement-track flex whitespace-nowrap"
            style={{ '--announcement-duration': `${announcementSpeed}s` } as CSSProperties}
          >
            {/* Exactly 2 copies, each auto-sized to the same content width:
                a -50% translateX then loops back seamlessly. */}
            {[0, 1].map((index) =>
              announcementLink ? (
                isInternalPath(announcementLink) ? (
                  <Link
                    key={index}
                    href={announcementLink}
                    className="inline-block shrink-0 px-10 text-xs font-bold uppercase text-white/75 transition-colors hover:text-white md:px-14"
                  >
                    {normalizedAnnouncement}
                  </Link>
                ) : (
                  <a
                    key={index}
                    href={announcementLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block shrink-0 px-10 text-xs font-bold uppercase text-white/75 transition-colors hover:text-white md:px-14"
                  >
                    {normalizedAnnouncement}
                  </a>
                )
              ) : (
                <span
                  key={index}
                  className="inline-block shrink-0 px-10 text-xs font-bold uppercase text-white/75 md:px-14"
                >
                  {normalizedAnnouncement}
                </span>
              ),
            )}
          </div>
        </div>
      ) : null}

      {/* Main Navbar */}
      <header
        className="sticky top-0 z-30 w-full"
        style={{
          background: 'var(--color-brand-nav)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left: Logo */}
          <Link href="/" className="flex flex-shrink-0 items-center whitespace-nowrap">
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                background: 'var(--color-accent)',
                borderRadius: 2,
                marginRight: 10,
              }}
            />
            <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 16, letterSpacing: '0.12em' }}>
              RAMA COMPUTER
            </span>
          </Link>

          {/* Center left: Category Menu */}
          {topCategories.length > 0 ? (
            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setIsCategoryMenuOpen(true)}
              onMouseLeave={() => setIsCategoryMenuOpen(false)}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCategoryMenuOpen((prev) => !prev);
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                aria-expanded={isCategoryMenuOpen}
                aria-label="Menu kategori"
              >
                <Grid3X3 size={16} />
                <span className="hidden lg:inline">Kategori</span>
                <ChevronDown size={14} style={{ opacity: 0.5 }} />
              </button>

              {isCategoryMenuOpen ? (
                <div
                  className="absolute left-0 z-50 mt-1 w-56 rounded-xl border bg-white p-2 shadow-lg"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <Link
                    href="/products"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-page)]"
                    onClick={() => setIsCategoryMenuOpen(false)}
                  >
                    Semua Kategori
                  </Link>
                  <div className="my-1 border-t border-[var(--color-border)]" />
                  {topCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] transition hover:bg-[var(--color-page)] hover:text-[var(--color-text)]"
                      onClick={() => setIsCategoryMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Center: Search */}
          <form action="/products" method="get" className="hidden flex-1 sm:flex" style={{ maxWidth: 480 }}>
            <div className="relative w-full">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              />
              <input
                type="text"
                name="q"
                placeholder="Cari produk..."
                className="w-full rounded-lg py-2.5 pl-9 pr-3 text-sm transition placeholder:text-white/35 focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              />
            </div>
          </form>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Saved products */}
            <Link
              href="/produk-tersimpan"
              className="rounded-lg p-2 transition"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              title="Produk Tersimpan"
            >
              <BookmarkIcon size={20} />
            </Link>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg font-semibold text-white transition"
              style={{
                background: 'var(--color-wa)',
                fontSize: 13,
                padding: '8px 16px',
                letterSpacing: '0.01em',
              }}
            >
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">WA</span>
            </a>

            {/* Auth */}
            {user ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserMenuOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                  aria-expanded={isUserMenuOpen}
                  aria-label="Menu akun"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    {user.name?.charAt(0).toUpperCase() ?? 'U'}
                  </div>
                  {retailBadge ? (
                    <span
                      className="hidden rounded-full border px-2 py-1 text-[11px] font-bold sm:inline-flex"
                      style={{
                        background: retailBadge.background,
                        borderColor: retailBadge.border,
                        color: retailBadge.color,
                      }}
                    >
                      {retailBadge.label}
                    </span>
                  ) : null}
                  <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-[var(--color-border)] bg-white p-2 shadow-lg">
                    <div className="border-b border-[var(--color-border)] px-3 py-2">
                      <p className="text-sm font-semibold text-[var(--color-text)]">{user.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
                      {retailBadge ? (
                        <p className="mt-1 text-[11px] font-semibold" style={{ color: retailBadge.color }}>
                          {retailBadge.label}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={accountHref}
                      className="block rounded px-3 py-2 text-sm text-[var(--color-text)] transition hover:bg-[var(--color-page)]"
                    >
                      Profil retail
                    </Link>
                    <Link
                      href="/"
                      className="block rounded px-3 py-2 text-sm text-[var(--color-text)] transition hover:bg-[var(--color-page)]"
                    >
                      Lihat toko
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-[var(--color-danger)] transition hover:bg-[var(--color-danger-soft)] disabled:opacity-60"
                    >
                      <LogOut size={16} />
                      {isLoggingOut ? 'Keluar...' : 'Keluar'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden rounded-lg px-3 py-2 text-sm transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 sm:block"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg text-sm transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.85)',
                    padding: '7px 14px',
                  }}
                >
                  Daftar Retail
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
