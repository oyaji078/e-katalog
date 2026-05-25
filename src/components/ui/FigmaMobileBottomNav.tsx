"use client";

import { BadgePercent, Home, LayoutDashboard, LayoutGrid, Package, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type FigmaMobileBottomNavProps = {
  user?: {
    role: string | null;
    retailStatus: string | null;
  } | null;
};

export default function FigmaMobileBottomNav({ user }: FigmaMobileBottomNavProps) {
  const pathname = usePathname();
  const account = getAccountItem(user);
  const items = [
    { id: "home", href: "/", icon: Home, label: "Beranda" },
    { id: "category", href: "/#kategori", icon: LayoutGrid, label: "Kategori" },
    { id: "promo", href: "/vouchers", icon: BadgePercent, label: "Voucher" },
    { id: "products", href: "/products", icon: Package, label: "Produk" },
    account,
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-border bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden">
      <div className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const path = item.href.split("#")[0] || "/";
          const isActive = item.href.includes("#")
            ? false
            : path === "/"
              ? pathname === "/"
              : pathname.startsWith(path);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? "text-brand-primary" : "text-brand-muted"
              }`}
            >
              {isActive ? (
                <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand-primary" />
              ) : null}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function getAccountItem(user: FigmaMobileBottomNavProps["user"]) {
  if (!user) return { id: "profile", href: "/login", icon: User, label: "Login" };
  if (user.role === "SUPER_ADMIN") {
    return { id: "profile", href: "/super-admin", icon: LayoutDashboard, label: "Super" };
  }
  if (user.role === "ADMIN") {
    return { id: "profile", href: "/admin", icon: LayoutDashboard, label: "Admin" };
  }
  if (user.retailStatus === "RETAIL_ACTIVE") {
    return { id: "profile", href: "/products", icon: User, label: "Akun Ritel" };
  }
  if (user.retailStatus === "PENDING_RETAIL") {
    return { id: "profile", href: "/retail/activate", icon: User, label: "Aktivasi" };
  }
  return { id: "profile", href: "/retail/request-token", icon: User, label: "Akun" };
}
