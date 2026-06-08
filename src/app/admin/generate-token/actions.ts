"use server";

import { createHash, randomInt } from "node:crypto";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { isFeatureEnabled, safeLogAdminActivity } from "@/lib/feature-flags";

export type GenerateTokenState = {
  success: boolean;
  token: string;
  message: string;
  error: string;
};

function failure(error: string): GenerateTokenState {
  return {
    success: false,
    token: "",
    message: "",
    error,
  };
}

function success(token: string, message: string): GenerateTokenState {
  return {
    success: true,
    token,
    message,
    error: "",
  };
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function generateUniqueOtpToken(db: ReturnType<typeof getDb>) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const token = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const hash = tokenHash(token);
    const existing = await db.retailToken.findUnique({
      where: { tokenHash: hash },
      select: { id: true },
    });

    if (!existing) return { token, tokenHash: hash };
  }

  throw new Error("Unable to generate a unique OTP.");
}

export async function generateTokenAction(
  _prevState: GenerateTokenState,
  formData: FormData
): Promise<GenerateTokenState> {
  const userId = String(formData.get("userId") ?? "");
  
  if (!userId) {
    return failure("Please select a user");
  }

  const db = getDb();
  const currentUser = await getCurrentUser();
  
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")) {
    return failure("Unauthorized");
  }

  const featureEnabled = await isFeatureEnabled("enable_retail_token_activation");
  if (!featureEnabled) {
    return failure("Retail token activation is currently disabled");
  }

  // Check if user exists and is eligible
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      whatsappNumber: true,
      storeName: true,
      userCode: true,
      retailStatus: true
    }
  });

  if (!user) {
    return failure("User not found");
  }

  if (user.retailStatus !== "PENDING_RETAIL") {
    return failure("Hanya pengguna dengan status Menunggu yang dapat diberikan token");
  }

  const now = new Date();
  const existingToken = await db.retailToken.findFirst({
    where: {
      assignedToUserId: userId,
      status: "ACTIVE",
      usedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    select: { tokenPreview: true },
    orderBy: { createdAt: "desc" },
  });

  if (existingToken && /^\d{6}$/.test(existingToken.tokenPreview)) {
    return success(
      existingToken.tokenPreview,
      `Kode aktivasi aktif untuk ${user.name} sudah tersedia. Gunakan kode yang sama sampai dipakai atau kedaluwarsa.`,
    );
  }

  const { token, tokenHash: generatedTokenHash } = await generateUniqueOtpToken(db);
  const tokenPreview = token;
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // Create token record
    await db.retailToken.create({
      data: {
        tokenHash: generatedTokenHash,
        tokenPreview,
        status: "ACTIVE",
        assignedToUserId: userId,
        generatedByUserId: currentUser.id,
        expiresAt,
        notes: `Generated for user ${user.name} (${user.email})`
      }
    });

    // Log admin activity (respects enable_admin_activity_log flag).
    // SECURITY: never put the raw OTP (tokenPreview) in the audit log — it is the
    // active credential. Only record who generated a token for whom.
    await safeLogAdminActivity({
      actorId: currentUser.id,
      actorRole: currentUser.role,
      action: "Generate retail token",
      targetType: "User",
      targetId: userId,
      risk: "MEDIUM",
      metadata: { userId, userName: user.name },
    });

    revalidatePath("/admin/generate-token");
    revalidatePath("/admin/retail-users");
    revalidatePath("/admin");

    // Return success with token (only shown once)
    return success(
      token,
      `OTP 6 digit berhasil dibuat untuk ${user.name}. Kode berlaku 24 jam dan hanya ditampilkan sekali.`
    );
  } catch {
    return failure("Gagal membuat OTP. Silakan coba lagi.");
  }
}
