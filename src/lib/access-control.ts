import { redirect } from "next/navigation";
import { headers } from "next/headers";

import type { RetailStatus, UserRole } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";

export type AppRole =
  | "guest"
  | "user"
  | "retail_pending"
  | "retail_active"
  | "admin"
  | "super_admin";

export type ProtectedModule =
  | "catalog"
  | "retail_token_request"
  | "retail_token_activation"
  | "retail_price"
  | "admin_dashboard"
  | "products"
  | "categories"
  | "brands"
  | "prices_and_margins"
  | "vouchers"
  | "retail_users"
  | "retail_token_generation"
  | "promo_banners"
  | "whatsapp_inquiries"
  | "reports"
  | "store_settings"
  | "admin_accounts"
  | "role_permissions"
  | "feature_flags"
  | "deployment_center"
  | "ci_cd_status"
  | "maintenance_mode"
  | "system_logs"
  | "security_settings"
  | "environment_info";

type SessionUser = {
  role?: UserRole | string | null;
  retailStatus?: RetailStatus | string | null;
} | null | undefined;

const adminModules = new Set<ProtectedModule>([
  "admin_dashboard",
  "products",
  "categories",
  "brands",
  "prices_and_margins",
  "vouchers",
  "retail_users",
  "retail_token_generation",
  "promo_banners",
  "whatsapp_inquiries",
  "reports",
  "store_settings",
]);

const superAdminOnlyModules = new Set<ProtectedModule>([
  "admin_accounts",
  "role_permissions",
  "feature_flags",
  "deployment_center",
  "ci_cd_status",
  "maintenance_mode",
  "system_logs",
  "security_settings",
  "environment_info",
]);

export function getEffectiveRole(user: SessionUser): AppRole {
  if (!user) return "guest";
  if (user.role === "SUPER_ADMIN") return "super_admin";
  if (user.role === "ADMIN") return "admin";
  if (user.retailStatus === "RETAIL_ACTIVE") return "retail_active";
  if (user.retailStatus === "PENDING_RETAIL") return "retail_pending";
  return "user";
}

export function canAccessModule(role: AppRole, module: ProtectedModule) {
  if (module === "catalog") return true;

  if (module === "retail_price") {
    return role === "retail_active" || role === "admin" || role === "super_admin";
  }

  if (module === "retail_token_request" || module === "retail_token_activation") {
    return role === "user" || role === "retail_pending";
  }

  if (superAdminOnlyModules.has(module)) {
    return role === "super_admin";
  }

  if (adminModules.has(module)) {
    return role === "admin" || role === "super_admin";
  }

  return false;
}

export function assertModuleAccess(role: AppRole, module: ProtectedModule) {
  if (!canAccessModule(role, module)) {
    throw new Error(`Access denied for ${module}.`);
  }
}

export function isAdminRole(role: AppRole) {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminRole(role: AppRole) {
  return role === "super_admin";
}

/**
 * Server-side helper: get current user's AppRole from session.
 */
export async function getCurrentUserRole(): Promise<AppRole> {
  const session = await auth.api.getSession({
    headers: await headers(),
  }).catch(() => null);
  return getEffectiveRole(session?.user);
}

/**
 * Require admin or super admin role. Redirects to /login if unauthorized.
 */
export async function requireAdmin() {
  const role = await getCurrentUserRole();
  if (!isAdminRole(role)) {
    redirect("/login");
  }
  return role as "admin" | "super_admin";
}

/**
 * Require super admin role. Redirects to /admin if unauthorized admin,
 * or /login if not logged in.
 */
export async function requireSuperAdmin() {
  const role = await getCurrentUserRole();
  if (role === "admin") {
    redirect("/admin");
  }
  if (!isSuperAdminRole(role)) {
    redirect("/login");
  }
  return role;
}
