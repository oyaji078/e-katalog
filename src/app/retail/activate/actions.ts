"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getCurrentSession } from "@/lib/session";
import { checkRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

export type ActivationState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function tokenHash(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}

export async function activateRetailToken(
  _previousState: ActivationState,
  formData: FormData,
): Promise<ActivationState> {
  const featureEnabled = await isFeatureEnabled("enable_retail_token_activation");

  if (!featureEnabled) {
    return {
      status: "error",
      message: "Aktivasi token ritel sedang dinonaktifkan.",
    };
  }

  const session = await getCurrentSession();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      status: "error",
      message: "Silakan masuk terlebih dahulu sebelum mengaktifkan akses ritel.",
    };
  }

  // The OTP is only 6 digits (1,000,000 combinations) and is scoped to this
  // user's own account, so without a per-user cap a logged-in user could
  // script repeated guesses and brute-force past admin approval.
  const rateLimit = await checkRateLimit({ headers: await headers() }, RATE_LIMITS.retailActivation, userId);
  if (!rateLimit.success) {
    return {
      status: "error",
      message: "Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.",
    };
  }

  const db = getDb();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { retailStatus: true },
  });

  if (!user || (user.retailStatus !== "REGISTERED" && user.retailStatus !== "PENDING_RETAIL")) {
    return {
      status: "error",
      message: `Status akun Anda "${user?.retailStatus ?? "tidak diketahui"}" tidak mengizinkan aktivasi token. Hanya akun ritel terdaftar yang dapat melakukan aktivasi.`,
    };
  }

  const token = String(formData.get("token") || "").trim();

  if (!token) {
    return {
      status: "error",
      message: "Masukkan OTP aktivasi ritel.",
    };
  }

  if (!/^\d{6}$/.test(token)) {
    return {
      status: "error",
      message: "Token aktivasi harus berupa 6 digit angka.",
    };
  }

  const hash = tokenHash(token);
  const now = new Date();

  const tokenRecord = await db.retailToken.findFirst({
    where: {
      tokenHash: hash,
      status: "ACTIVE",
      expiresAt: { gt: now },
      assignedToUserId: userId,
      usedAt: null,
      revokedAt: null,
    },
  });

  if (!tokenRecord) {
    return {
      status: "error",
      message: "Token tidak valid, sudah dipakai, kedaluwarsa, dicabut, atau tidak ditujukan untuk akun Anda.",
    };
  }

  // Atomically consume the token. The defensive where-clause (status ACTIVE,
  // usedAt null, revokedAt null) means a concurrent or replayed activation
  // updates 0 rows and is rejected — the token is strictly single-use.
  const activated = await db.$transaction(async (tx) => {
    const consumed = await tx.retailToken.updateMany({
      where: {
        id: tokenRecord.id,
        status: "ACTIVE",
        usedAt: null,
        revokedAt: null,
      },
      data: {
        status: "USED",
        usedAt: now,
      },
    });

    if (consumed.count === 0) {
      return false;
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        retailStatus: "RETAIL_ACTIVE",
      },
    });

    return true;
  });

  if (!activated) {
    // Do not reveal whether the token exists — same message as a bad token.
    return {
      status: "error",
      message: "Token tidak valid, sudah dipakai, kedaluwarsa, dicabut, atau tidak ditujukan untuk akun Anda.",
    };
  }

  revalidatePath("/retail/activate");

  return {
    status: "success",
    message: "Akun ritel Anda berhasil diaktifkan. Anda kini dapat melihat harga dan voucher ritel.",
  };
}
