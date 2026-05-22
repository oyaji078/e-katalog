import { redirect } from "next/navigation";
import { headers } from "next/headers";

import type { UserRole } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";

export type AdminSession = {
  user: {
    id: string;
    role?: UserRole | string | null;
    name?: string | null;
    email?: string | null;
  };
};

/**
 * Get admin session. Returns null if not admin or super admin.
 */
export async function getAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN")) {
    return null;
  }

  return session as AdminSession;
}

/**
 * Get admin or super admin session, redirecting to /login if unauthorized.
 * Returns the session with typed role string.
 */
export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }
  return session as AdminSession & { user: { role: "ADMIN" | "SUPER_ADMIN" } };
}

/**
 * Get super admin session. Redirects admins to /admin, others to /login.
 */
export async function requireSuperAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return session as AdminSession & { user: { role: "SUPER_ADMIN" } };
}

export function toUserRole(role: AdminSession["user"]["role"]): UserRole | null {
  if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "USER") {
    return role;
  }

  return null;
}
