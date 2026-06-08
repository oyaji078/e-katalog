'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Grid,
  Bookmark,
  User,
  Gift,
} from 'lucide-react';

type MobileBottomNavProps = {
  publicVoucherEnabled?: boolean;
  isLoggedIn?: boolean;
};

export default function MobileBottomNav({
  publicVoucherEnabled = false,
  isLoggedIn = false,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: '/', icon: Home, label: 'Beranda' },
    { href: '/products', icon: Grid, label: 'Katalog' },
    ...(publicVoucherEnabled
      ? [{ href: '/vouchers', icon: Gift, label: 'Voucher' }]
      : []),
    { href: '/produk-tersimpan', icon: Bookmark, label: 'Simpan' },
    { href: isLoggedIn ? '/account' : '/login', icon: User, label: 'Akun' },
  ];

  return (
    <>
      {/* Bottom nav container - only visible on mobile (< lg) */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-white border-t border-[var(--color-border)] safe-area-inset-bottom">
        <div className="flex items-center justify-around h-[56px] sm:h-[60px]">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition ${
                  active
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-text-light)]'
                }`}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer to avoid content overlap - only visible on mobile */}
      <div className="h-[56px] sm:h-[60px] lg:hidden" />
    </>
  );
}
