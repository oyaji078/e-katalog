"use client";

import {
  BarChart3,
  Bookmark,
  FileText,
  Flag,
  Globe,
  Image,
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
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

type SidebarProps = {
  role: "ADMIN" | "SUPER_ADMIN" | string | null | undefined;
  brandName?: string;
  logoUrl?: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const STORAGE_KEY = "ekatalog_sidebar_collapsed";
const EXPANDED_W = 256;
const COLLAPSED_W = 72;

const adminMenus: NavGroup[] = [
  {
    label: "Katalog",
    items: [
      { href: "/admin", label: "Dasbor", icon: LayoutDashboard },
      { href: "/admin/products", label: "Produk", icon: Package },
      { href: "/admin/categories", label: "Kategori", icon: Tags },
      { href: "/admin/brands", label: "Merek", icon: Bookmark },
    ],
  },
  {
    label: "Promosi",
    items: [
      { href: "/admin/promo-vouchers", label: "Promosi & Voucher", icon: TicketPercent },
      { href: "/admin/flash-sales", label: "Flash Sale", icon: Zap },
      { href: "/admin/hero-banners", label: "Hero Banner", icon: Image },
    ],
  },
  {
    label: "Pengguna & Laporan",
    items: [
      { href: "/admin/retail-users", label: "Pengguna Ritel", icon: Users },
      { href: "/admin/inquiries", label: "Inquiry", icon: BarChart3 },
      { href: "/admin/reports", label: "Laporan", icon: FileText },
    ],
  },
  {
    label: "Pengaturan",
    items: [{ href: "/admin/store-settings", label: "Pengaturan Toko", icon: Settings }],
  },
];

const superAdminMenus: NavGroup[] = [
  {
    label: "Sistem",
    items: [
      { href: "/super-admin", label: "Dasbor", icon: LayoutDashboard },
      { href: "/super-admin/system", label: "System", icon: Wrench },
      { href: "/super-admin/feature-flags", label: "Feature Flags", icon: Flag },
      { href: "/super-admin/deployment", label: "Deploy", icon: Terminal },
      { href: "/super-admin/ci-cd", label: "CI/CD", icon: Wrench },
      { href: "/super-admin/maintenance", label: "Maintenance", icon: Settings },
      { href: "/super-admin/environment", label: "Environment", icon: Globe },
    ],
  },
  {
    label: "Pengguna",
    items: [
      { href: "/super-admin/admin-users", label: "Admin Users", icon: Shield },
      { href: "/super-admin/roles", label: "Roles", icon: Users },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { href: "/super-admin/system-logs", label: "Activity Logs", icon: FileText },
      { href: "/super-admin/security", label: "Security", icon: Shield },
      { href: "/super-admin/reports", label: "Reports", icon: FileText },
    ],
  },
];

export default function AdminSidebar({ role, brandName = "RAMA COMPUTER", logoUrl }: SidebarProps) {
  const pathname = usePathname();
  const isSuperAdminArea = role === "SUPER_ADMIN" && pathname.startsWith("/super-admin");
  const groups = isSuperAdminArea ? superAdminMenus : adminMenus;
  // Start from a consistent value on both server and client (always false) to
  // avoid a hydration mismatch. The persisted value is read after mount.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Read the persisted value after the first paint so the initial render
    // matches the server (always expanded) and no hydration mismatch occurs.
    const frame = requestAnimationFrame(() => {
      try {
        if (localStorage.getItem(STORAGE_KEY) === "true") setCollapsed(true);
      } catch {
        // localStorage not available
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // localStorage not available
    }
  };

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--admin-sidebar-width",
      collapsed ? `${COLLAPSED_W}px` : `${EXPANDED_W}px`,
    );
  }, [collapsed]);

  return (
    <aside
      suppressHydrationWarning
      style={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
      className="fixed left-0 top-0 z-40 flex h-screen shrink-0 flex-col border-r border-white/10 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] transition-[width] duration-200"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center border-b border-white/10 px-3 py-3">
          <button
            type="button"
            onClick={toggle}
            className="flex min-w-0 items-center gap-2.5 rounded-lg transition hover:bg-white/10"
            style={{ padding: collapsed ? "4px" : "4px 8px" }}
            title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={brandName}
                className="size-8 shrink-0 rounded-lg border border-white/20 bg-white/10 object-contain p-1"
              />
            ) : (
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)" }}
              >
                <span className="text-sm font-extrabold tracking-tight text-white">
                  {brandInitials(brandName)}
                </span>
              </div>
            )}
            {collapsed ? null : (
              <span
                className="min-w-0 truncate text-xs font-bold uppercase tracking-[0.1em] text-white/95"
              >
                {brandName}
              </span>
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
          {groups.map((group) => (
            <div key={group.label} className="mb-2">
              <SectionLabel collapsed={collapsed} label={group.label} />
              <MenuGroup>
                {group.items.map((menu) => (
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
          ))}
        </nav>

        <div
          className="shrink-0 border-t px-3 py-3 text-center"
          style={{ borderColor: "var(--sidebar-border)" }}
        >
          {collapsed ? null : (
            <span className="text-[10px] tracking-wide text-white/20">v0.1.0</span>
          )}
        </div>
      </div>
    </aside>
  );
}

function brandInitials(value: string) {
  const letters = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return letters || "RC";
}

function isActive(href: string, currentPath: string): boolean {
  if (href === "/admin" || href === "/super-admin") {
    return currentPath === href;
  }
  return currentPath.startsWith(href);
}

function MenuGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-0.5">{children}</div>;
}

function SectionLabel({ collapsed, label }: { collapsed: boolean; label: string }) {
  return (
    <div
      className={
        collapsed
          ? "mt-3"
          : "mb-0.5 mt-3 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.10em] text-[var(--sidebar-section-label)]"
      }
      aria-hidden={collapsed || undefined}
      suppressHydrationWarning
    >
      {collapsed ? null : label}
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
  icon: ComponentType<{ size?: number }>;
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
          ? "bg-[var(--sidebar-active-bg)] font-semibold text-[var(--sidebar-active-text)]"
          : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-hover-text)]"
      }`}
      title={collapsed ? label : undefined}
    >
      {active && !collapsed ? (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--sidebar-active-accent)]" />
      ) : null}
      <Icon size={18} />
      {collapsed ? null : <span className="min-w-0 truncate">{label}</span>}
      {collapsed ? (
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[var(--color-brand-mid)] px-2.5 py-1.5 text-xs font-medium text-white/90 shadow-lg group-hover:block">
          {label}
        </span>
      ) : null}
    </Link>
  );
}
