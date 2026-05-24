"use server";

import { revalidatePath } from "next/cache";

import { hashPassword, verifyPassword } from "@better-auth/utils/password";
import { getDb } from "@/lib/db";
import { requireSuperAdminSession } from "@/lib/admin-auth";

export type AdminUserActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

export async function changeUserRole(_prevState: AdminUserActionResult, formData: FormData): Promise<AdminUserActionResult> {
  const session = await requireSuperAdminSession();
  const db = getDb();

  const userId = formData.get("userId") as string;
  const newRole = formData.get("role") as string;

  if (!userId || !newRole) return { success: false, message: "", error: "Data tidak lengkap" };
  if (newRole !== "USER" && newRole !== "ADMIN" && newRole !== "SUPER_ADMIN") {
    return { success: false, message: "", error: "Role tidak valid" };
  }
  if (userId === session.user.id && newRole !== "SUPER_ADMIN") {
    return { success: false, message: "", error: "Tidak dapat menurunkan role sendiri" };
  }

  const targetUser = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!targetUser) return { success: false, message: "", error: "User tidak ditemukan" };

  if (targetUser.role === "SUPER_ADMIN" && newRole !== "SUPER_ADMIN") {
    const superAdminCount = await db.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdminCount <= 1) return { success: false, message: "", error: "Tidak dapat menurunkan satu-satunya Super Admin" };
  }

  await db.user.update({ where: { id: userId }, data: { role: newRole } });
  revalidatePath("/super-admin/admin-users");

  return { success: true, message: "Role berhasil diubah" };
}

export async function resetUserPassword(_prevState: AdminUserActionResult, formData: FormData): Promise<AdminUserActionResult> {
  const session = await requireSuperAdminSession();
  const db = getDb();

  const userId = formData.get("userId") as string;
  const newPassword = formData.get("newPassword") as string;
  const currentPassword = formData.get("currentPassword") as string;

  if (!userId || !newPassword || !currentPassword) return { success: false, message: "", error: "Data tidak lengkap" };
  if (newPassword.length < 8) return { success: false, message: "", error: "Password minimal 8 karakter" };
  if (newPassword.length > 128) return { success: false, message: "", error: "Password maksimal 128 karakter" };

  const adminAccount = await db.account.findFirst({
    where: { userId: session.user.id, providerId: "credential" },
    select: { password: true },
  });

  if (!adminAccount?.password) return { success: false, message: "", error: "Akun admin tidak ditemukan" };

  const isValid = await verifyPassword(adminAccount.password, currentPassword);
  if (!isValid) return { success: false, message: "", error: "Password saat ini salah" };

  const hashed = await hashPassword(newPassword);
  await db.account.updateMany({
    where: { userId, providerId: "credential" },
    data: { password: hashed },
  });
  await db.session.deleteMany({ where: { userId } });

  return { success: true, message: "Password berhasil direset" };
}

export async function deleteUser(_prevState: AdminUserActionResult, formData: FormData): Promise<AdminUserActionResult> {
  const session = await requireSuperAdminSession();
  const db = getDb();

  const userId = formData.get("userId") as string;
  if (!userId) return { success: false, message: "", error: "Data tidak lengkap" };
  if (userId === session.user.id) return { success: false, message: "", error: "Tidak dapat menghapus akun sendiri" };

  const targetUser = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!targetUser) return { success: false, message: "", error: "User tidak ditemukan" };

  if (targetUser.role === "SUPER_ADMIN") {
    const superAdminCount = await db.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdminCount <= 1) return { success: false, message: "", error: "Tidak dapat menghapus satu-satunya Super Admin" };
  }

  await db.user.delete({ where: { id: userId } });
  revalidatePath("/super-admin/admin-users");

  return { success: true, message: "User berhasil dihapus" };
}
