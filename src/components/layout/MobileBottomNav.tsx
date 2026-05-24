"use client";

import {
  BadgePercent,
  Grid3X3,
  Home,
  KeyRound,
  LayoutDashboard,
  Package,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type MobileBottomNavProps = {
  user?: {
    role: string | null;
    retailStatus: string | null;
  } | null;
};

export default function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname();
  const accountItem = getAccountItem(user);
  const items = [
    { label: "Beranda", href: "/", icon: Home },
    { label: "Kategori", href: "/#kategori", icon: Grid3X3 },
    { label: "Voucher", href: "/vouchers", icon: BadgePercent },
    { label: "Produk", href: "/products", icon: Package },
    accountItem,
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border-gray bg-white/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const pathOnly = item.href.split(/[?#]/)[0] || "/";
          const isActive = item.href.includes("#")
            ? false
            : pathOnly === "/"
              ? pathname === "/"
              : pathname.startsWith(pathOnly);

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-black transition ${
                isActive
                  ? "bg-primary-maroon text-white"
                  : "text-text-muted hover:bg-soft-bg hover:text-primary-maroon"
              }`}
            >
              <span className="relative">
                <Icon className="size-5" />
                {item.badge ? (
                  <span className="absolute -right-2 -top-1 size-2 rounded-full bg-soft-teal" />
                ) : null}
              </span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function getAccountItem(user: MobileBottomNavProps["user"]) {
  if (!user) {
    return { label: "Login", href: "/login", icon: UserRound };
  }

  if (user.role === "SUPER_ADMIN") {
    return { label: "Super", href: "/super-admin", icon: LayoutDashboard };
  }

  if (user.role === "ADMIN") {
    return { label: "Admin", href: "/admin", icon: LayoutDashboard };
  }

  if (user.retailStatus === "RETAIL_ACTIVE") {
    return { label: "Akun Ritel", href: "/products", icon: UserRound, badge: true };
  }

  if (user.retailStatus === "PENDING_RETAIL") {
    return { label: "Aktivasi", href: "/retail/activate", icon: KeyRound };
  }

  return { label: "Token", href: "/retail/request-token", icon: KeyRound };
}
