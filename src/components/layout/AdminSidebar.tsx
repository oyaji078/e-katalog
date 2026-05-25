"use client";

import {
  BarChart3,
  Bookmark,
  FileText,
  Flag,
  Globe,
  Image,
  KeyRound,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  Tags,
  Terminal,
  TicketPercent,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import LogoutButton from "@/components/layout/LogoutButton";

type SidebarProps = {
  role: "ADMIN" | "SUPER_ADMIN" | string | null | undefined;
};

const STORAGE_KEY = "ekatalog_sidebar_collapsed";
const EXPANDED_W = 256;
const COLLAPSED_W = 72;

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

export default function AdminSidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(STORAGE_KEY) === "true";
      } catch {
        return false;
      }
    }
    return false;
  });

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // localStorage not available
    }
  };

  return (
    <aside
      suppressHydrationWarning
      style={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
      className="flex h-screen shrink-0 flex-col border-r border-brand-border bg-white transition-[width] duration-200"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Brand / Collapse toggle */}
        <div className="flex shrink-0 items-center border-b border-brand-border px-3 py-3">
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-2.5 rounded-lg transition hover:bg-brand-bg"
            style={{ padding: collapsed ? "4px" : "4px 8px" }}
            title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary">
              <span className="text-xs font-black text-white">EK</span>
            </div>
            {collapsed ? null : (
              <span className="truncate text-sm font-bold text-brand-text">E-Katalog</span>
            )}
          </button>
        </div>

        {/* Menu items — scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
          <MenuGroup>
            {adminMenus.map((menu) => (
              <SidebarLink
                key={menu.href}
                href={menu.href}
                label={menu.label}
                icon={menu.icon}
                collapsed={collapsed}
                active={isActive(menu.href, pathname)}
              />
            ))}
          </MenuGroup>

          {isSuperAdmin ? (
            <div className="mt-2">
              <SectionLabel collapsed={collapsed} label="Sistem" />
              <MenuGroup>
                {superAdminMenus.map((menu) => (
                  <SidebarLink
                    key={menu.href}
                    href={menu.href}
                    label={menu.label}
                    icon={menu.icon}
                    collapsed={collapsed}
                    active={isActive(menu.href, pathname)}
                  />
                ))}
              </MenuGroup>
            </div>
          ) : null}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-brand-border px-2 py-2">
          <LogoutButton
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger/10 ${
              collapsed ? "justify-center px-2" : ""
            }`}
            iconOnly={collapsed}
          />
        </div>
      </div>
    </aside>
  );
}

function isActive(href: string, currentPath: string): boolean {
  if (href === "/admin" || href === "/super-admin") {
    return currentPath === href;
  }
  return currentPath.startsWith(href);
}

function MenuGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-0.5">{children}</div>;
}

function SectionLabel({ collapsed, label }: { collapsed: boolean; label: string }) {
  if (collapsed) {
    return (
      <div className="mb-1 mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-brand-muted/50">
        •••
      </div>
    );
  }
  return (
    <div className="mb-0.5 mt-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted/60">
      {label}
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  collapsed,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-lg text-sm font-medium transition ${
        collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
      } ${
        active
          ? "bg-brand-primary/10 font-bold text-brand-primary"
          : "text-brand-muted hover:bg-brand-bg hover:text-brand-primary"
      }`}
      title={collapsed ? label : undefined}
    >
      {active && !collapsed ? (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand-primary" />
      ) : null}
      <Icon size={20} />
      {collapsed ? null : <span className="truncate">{label}</span>}
    </Link>
  );
}
