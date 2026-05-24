import { getCurrentUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { requireSuperAdminSession } from "@/lib/admin-auth";

import AdminUsersClient from "./AdminUsersClient";

export const dynamic = "force-dynamic";

type SerializedUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  createdAt: string;
};

export default async function AdminUsersPage() {
  await requireSuperAdminSession();
  const currentUser = await getCurrentUser();
  const db = getDb();

  const adminUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const serialized: SerializedUser[] = adminUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <AdminUsersClient
      users={serialized}
      currentUserId={currentUser?.id ?? ""}
    />
  );
}
