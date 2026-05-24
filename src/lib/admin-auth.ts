import { redirect } from "next/navigation";

import type { UserRole } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/session";

export type AdminSession = {
  user: {
    id: string;
    role: string | null;
    name: string | null;
    email: string | null;
  };
};

export async function getAdminSession() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return null;
  }
  return { user } as AdminSession;
}

export async function requireAdminSession(callbackUrl?: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
  }
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect(`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
  }
  return { user } as AdminSession & { user: { role: "ADMIN" | "SUPER_ADMIN" } };
}

export async function requireSuperAdminSession(callbackUrl?: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
  }
  if (user.role === "ADMIN") {
    redirect(`/admin${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
  }
  if (user.role !== "SUPER_ADMIN") {
    redirect(`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
  }
  return { user } as AdminSession & { user: { role: "SUPER_ADMIN" } };
}

export function toUserRole(role: string | null): UserRole | null {
  if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "USER") {
    return role;
  }
  return null;
}
