"use client";

import {
  LayoutDashboard,
  Package,
  Tags,
  TicketPercent,
  Users,
  Menu as MenuIcon,
  X,
  Bookmark,
  Zap,
  Image,
  BarChart3,
  FileText,
  Settings,
  KeyRound,
  Shield,
  Flag,
  Terminal,
  Wrench,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import LogoutButton from "@/components/layout/LogoutButton";

type AdminMobileNavProps = {
  role: string | null | undefined;
};

const bottomItems = [
  { href: "/admin/products", icon: Package, label: "Produk" },
  { href: "/admin/categories", icon: Tags, label: "Kategori" },
  { href: "/admin/promo-vouchers", icon: TicketPercent, label: "Promo" },
  { href: "/admin/retail-users", icon: Users, label: "Ritel" },
];

const adminMenus = [
  { href: "/admin", label: "Dasbor", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/categories", label: "Kategori", icon: Tags },
  { href: "/admin/brands", label: "Merek", icon: Bookmark },
  { href: "/admin/flash-sales", label: "Flash Sale", icon: Zap },
  { href: "/admin/promo-vouchers", label: "Promo & Voucher", icon: TicketPercent },
  { href: "/admin/hero-banners", label: "Hero Banner", icon: Image },
  { href: "/admin/retail-users", label: "Pengguna Ritel", icon: Users },
  { href: "/admin/inquiries", label: "Inquiry", icon: BarChart3 },
  { href: "/admin/reports", label: "Laporan", icon: FileText },
  { href: "/admin/store-settings", label: "Pengaturan Toko", icon: Settings },
  { href: "/admin/generate-token", label: "Generate Token", icon: KeyRound },
];

const superAdminMenus = [
  { href: "/super-admin/admin-users", label: "Admin", icon: Shield },
  { href: "/super-admin/feature-flags", label: "Fitur", icon: Flag },
  { href: "/super-admin/deployment", label: "Deploy", icon: Terminal },
  { href: "/super-admin/ci-cd", label: "CI/CD", icon: Wrench },
  { href: "/super-admin/maintenance", label: "Maintenance", icon: Settings },
  { href: "/super-admin/system-logs", label: "Log", icon: FileText },
  { href: "/super-admin/security", label: "Keamanan", icon: Shield },
  { href: "/super-admin/environment", label: "Environment", icon: Globe },
  { href: "/super-admin/roles", label: "Roles", icon: Users },
];

export default function AdminMobileNav({ role }: AdminMobileNavProps) {
  const pathname = usePathname();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menus = isSuperAdmin
    ? [{ label: "Menu Admin", items: adminMenus }, { label: "Sistem", items: superAdminMenus }]
    : [{ label: "Menu Admin", items: adminMenus }];

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-border bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="grid h-14 grid-cols-5">
          {bottomItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? "text-brand-primary" : "text-brand-muted"
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-brand-muted transition-colors hover:text-brand-primary"
          >
            <MenuIcon size={18} />
            <span className="text-[10px] font-bold">Menu</span>
          </button>
        </div>
      </nav>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
          <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-primary">
                <span className="text-xs font-black text-white">EK</span>
              </div>
              <span className="text-sm font-bold text-brand-text">E-Katalog</span>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-brand-muted hover:bg-brand-bg"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {menus.map((group) => (
              <div key={group.label} className="mb-3">
                <div className="mb-0.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted/60">
                  {group.label}
                </div>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active = item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          active
                            ? "bg-brand-primary/10 font-bold text-brand-primary"
                            : "text-brand-muted hover:bg-brand-bg hover:text-brand-primary"
                        }`}
                      >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                        {active ? (
                          <span className="ml-auto h-2 w-2 rounded-full bg-brand-primary" />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-brand-border px-3 py-3">
            <LogoutButton
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/10"
              iconOnly={false}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
