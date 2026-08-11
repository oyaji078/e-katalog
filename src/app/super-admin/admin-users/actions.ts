"use server";

import { revalidatePath } from "next/cache";

import { hashPassword, verifyPassword } from "@better-auth/utils/password";
import { logAdminActivity } from "@/lib/activity-log";
import { requireSuperAdminSession, toUserRole } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";

export type AdminUserActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

async function verifyCurrentAdminPassword(
  db: ReturnType<typeof getDb>,
  adminUserId: string,
  currentPassword: string,
) {
  if (!currentPassword) return false;

  const adminAccount = await db.account.findFirst({
    where: { userId: adminUserId, providerId: "credential" },
    select: { password: true },
  });

  if (!adminAccount?.password) return false;
  return verifyPassword(adminAccount.password, currentPassword);
}

export async function changeUserRole(_prevState: AdminUserActionResult, formData: FormData): Promise<AdminUserActionResult> {
  const session = await requireSuperAdminSession();
  const db = getDb();

  const userId = formData.get("userId") as string;
  const newRole = formData.get("role") as string;
  const currentPassword = String(formData.get("currentPassword") ?? "");

  if (!userId || !newRole) return { success: false, message: "", error: "Data tidak lengkap" };
  if (!currentPassword) return { success: false, message: "", error: "Password saat ini wajib diisi" };
  if (newRole !== "USER" && newRole !== "ADMIN" && newRole !== "SUPER_ADMIN") {
    return { success: false, message: "", error: "Role tidak valid" };
  }
  if (userId === session.user.id && newRole !== "SUPER_ADMIN") {
    return { success: false, message: "", error: "Tidak dapat menurunkan role sendiri" };
  }

  const passwordValid = await verifyCurrentAdminPassword(db, session.user.id, currentPassword);
  if (!passwordValid) return { success: false, message: "", error: "Password saat ini salah" };

  const targetUser = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!targetUser) return { success: false, message: "", error: "User tidak ditemukan" };

  if (targetUser.role === "SUPER_ADMIN" && newRole !== "SUPER_ADMIN") {
    const superAdminCount = await db.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdminCount <= 1) return { success: false, message: "", error: "Tidak dapat menurunkan satu-satunya Super Admin" };
  }

  await db.user.update({ where: { id: userId }, data: { role: newRole } });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "User role changed",
    targetType: "User",
    targetId: userId,
    risk: "HIGH",
    metadata: { from: targetUser.role, to: newRole },
  });

  revalidatePath("/super-admin/admin-users");

  return { success: true, message: "Role berhasil diubah" };
}

function generateAdminUserCode() {
  return `USR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function createAdminUser(_prevState: AdminUserActionResult, formData: FormData): Promise<AdminUserActionResult> {
  const session = await requireSuperAdminSession();
  const db = getDb();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "USER");
  const password = String(formData.get("password") ?? "");
  const currentPassword = String(formData.get("currentPassword") ?? "");

  if (!name || !email || !password || !currentPassword) {
    return { success: false, message: "", error: "Data tidak lengkap." };
  }
  if (!email.includes("@")) {
    return { success: false, message: "", error: "Email tidak valid." };
  }
  if (!["USER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return { success: false, message: "", error: "Role tidak valid." };
  }
  if (password.length < 8) {
    return { success: false, message: "", error: "Password minimal 8 karakter." };
  }

  const passwordValid = await verifyCurrentAdminPassword(db, session.user.id, currentPassword);
  if (!passwordValid) {
    return { success: false, message: "", error: "Password saat ini salah." };
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return { success: false, message: "", error: "Email sudah digunakan oleh akun lain." };
  }

  const hashedPassword = await hashPassword(password);
  const userCode = generateAdminUserCode();

  await db.user.create({
    data: {
      id: crypto.randomUUID(),
      name,
      email,
      role: role as "USER" | "ADMIN" | "SUPER_ADMIN",
      emailVerified: true,
      userCode,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: email,
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "User created",
    targetType: "User",
    targetId: email,
    risk: "HIGH",
    metadata: { role },
  });

  revalidatePath("/super-admin/admin-users");

  return { success: true, message: "User baru berhasil ditambahkan." };
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

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "User password reset",
    targetType: "User",
    targetId: userId,
    risk: "HIGH",
  });

  return { success: true, message: "Password berhasil direset" };
}

export async function deleteUser(_prevState: AdminUserActionResult, formData: FormData): Promise<AdminUserActionResult> {
  const session = await requireSuperAdminSession();
  const db = getDb();

  const userId = formData.get("userId") as string;
  const currentPassword = String(formData.get("currentPassword") ?? "");
  if (!userId) return { success: false, message: "", error: "Data tidak lengkap" };
  if (!currentPassword) return { success: false, message: "", error: "Password saat ini wajib diisi" };
  if (userId === session.user.id) return { success: false, message: "", error: "Tidak dapat menghapus akun sendiri" };

  const passwordValid = await verifyCurrentAdminPassword(db, session.user.id, currentPassword);
  if (!passwordValid) return { success: false, message: "", error: "Password saat ini salah" };

  const targetUser = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!targetUser) return { success: false, message: "", error: "User tidak ditemukan" };

  if (targetUser.role === "SUPER_ADMIN") {
    const superAdminCount = await db.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdminCount <= 1) return { success: false, message: "", error: "Tidak dapat menghapus satu-satunya Super Admin" };
  }

  await db.user.delete({ where: { id: userId } });

  await logAdminActivity({
    actorId: session.user.id,
    actorRole: toUserRole(session.user.role),
    action: "User deleted",
    targetType: "User",
    targetId: userId,
    risk: "HIGH",
    metadata: { role: targetUser.role },
  });

  revalidatePath("/super-admin/admin-users");

  return { success: true, message: "User berhasil dihapus" };
}
