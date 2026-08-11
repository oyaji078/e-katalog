"use client";

import {
  BadgePercent,
  Bookmark,
  FileText,
  Flag,
  Grid3X3,
  Home,
  LayoutDashboard,
  Package,
  Shield,
  User,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import LogoutButton from "@/components/layout/LogoutButton";

type FigmaMobileBottomNavProps = {
  user?: {
    role: string | null;
    retailStatus: string | null;
  } | null;
  voucherEnabled?: boolean;
};

type NavItem = {
  id: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
};

function isActiveItem(href: string, pathname: string): boolean {
  const path = href.split("#")[0] || "/";
  if (href.includes("#")) return false;
  if (path === "/") return pathname === "/";
  return pathname.startsWith(path);
}

export default function FigmaMobileBottomNav({ user, voucherEnabled = false }: FigmaMobileBottomNavProps) {
  const pathname = usePathname();

  if (!user) {
    return <GuestNav pathname={pathname} voucherEnabled={voucherEnabled} />;
  }

  if (user.role === "ADMIN") {
    return <AdminNav pathname={pathname} />;
  }

  if (user.role === "SUPER_ADMIN") {
    return <SuperAdminNav pathname={pathname} />;
  }

  return <RetailNav user={user} pathname={pathname} voucherEnabled={voucherEnabled} />;
}

function GuestNav({ pathname, voucherEnabled }: { pathname: string; voucherEnabled: boolean }) {
  const items: NavItem[] = [
    { id: "home", href: "/", icon: Home, label: "Beranda" },
    { id: "products", href: "/products", icon: Grid3X3, label: "Katalog" },
    voucherEnabled
      ? { id: "vouchers", href: "/vouchers", icon: BadgePercent, label: "Voucher" }
      : { id: "categories", href: "/categories", icon: Package, label: "Kategori" },
    { id: "saved", href: "/produk-tersimpan", icon: Bookmark, label: "Simpan" },
    { id: "login", href: "/login", icon: User, label: "Masuk" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#D7DEE8] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(228,211,41,0.12)] backdrop-blur-xl md:hidden">
      <div className="grid h-16 grid-cols-5 px-1">
        {items.map((item) => {
          const active = isActiveItem(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
                active ? "text-[#E4D329]" : "text-[#5B6472] hover:text-[#111827]"
              }`}
            >
              {active ? (
                <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#E4D329]" />
              ) : null}
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="max-w-full truncate text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function RetailNav({
  user,
  pathname,
  voucherEnabled,
}: {
  user: NonNullable<FigmaMobileBottomNavProps["user"]>;
  pathname: string;
  voucherEnabled: boolean;
}) {
  const items: NavItem[] = [
    { id: "home", href: "/", icon: Home, label: "Beranda" },
    { id: "products", href: "/products", icon: Grid3X3, label: "Katalog" },
    voucherEnabled
      ? { id: "vouchers", href: "/vouchers", icon: BadgePercent, label: "Voucher" }
      : { id: "categories", href: "/categories", icon: Package, label: "Kategori" },
    { id: "saved", href: "/produk-tersimpan", icon: Bookmark, label: "Simpan" },
    { id: "account", href: user.retailStatus === "RETAIL_ACTIVE" ? "/products" : "/retail/request-token", icon: User, label: user.retailStatus === "RETAIL_ACTIVE" ? "Akun" : "Akun" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#D7DEE8] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(228,211,41,0.12)] backdrop-blur-xl md:hidden">
      <div className="grid h-16 grid-cols-5 px-1">
        {items.map((item) => {
          const active = isActiveItem(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
                active ? "text-brand-accent" : "text-brand-muted hover:text-brand-text"
              }`}
            >
              {active ? (
                <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand-accent" />
              ) : null}
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="max-w-full truncate text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AdminNav({ pathname }: { pathname: string }) {
  const items: NavItem[] = [
    { id: "dashboard", href: "/admin", icon: LayoutDashboard, label: "Dasbor" },
    { id: "products", href: "/admin/products", icon: Package, label: "Produk" },
    { id: "retail", href: "/admin/retail-users", icon: Users, label: "Ritel" },
    { id: "reports", href: "/admin/reports", icon: FileText, label: "Laporan" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#D7DEE8] bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden">
      <div className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const active = isActiveItem(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? "text-[#0D0B61]" : "text-[#5B6472]"
              }`}
            >
              {active ? (
                <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#0D0B61]" />
              ) : null}
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
        <LogoutButton className="flex flex-col items-center justify-center gap-0.5 text-[#5B6472] transition-colors hover:text-[#EF4444] disabled:opacity-60" />
      </div>
    </nav>
  );
}

function SuperAdminNav({ pathname }: { pathname: string }) {
  const items: NavItem[] = [
    { id: "dashboard", href: "/super-admin", icon: LayoutDashboard, label: "Dasbor" },
    { id: "admin-users", href: "/super-admin/admin-users", icon: Shield, label: "Admin" },
    { id: "features", href: "/super-admin/feature-flags", icon: Flag, label: "Fitur" },
    { id: "system", href: "/super-admin/system", icon: Wrench, label: "Sistem" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#D7DEE8] bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden">
      <div className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const active = isActiveItem(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? "text-[#0D0B61]" : "text-[#5B6472]"
              }`}
            >
              {active ? (
                <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#0D0B61]" />
              ) : null}
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
        <LogoutButton className="flex flex-col items-center justify-center gap-0.5 text-[#5B6472] transition-colors hover:text-[#EF4444] disabled:opacity-60" />
      </div>
    </nav>
  );
}
