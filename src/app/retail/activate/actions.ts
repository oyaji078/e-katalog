"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getCurrentSession } from "@/lib/session";

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
      message: "Retail token activation is currently disabled.",
    };
  }

  const session = await getCurrentSession();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      status: "error",
      message: "Please log in before activating retail access.",
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
      message: `Your account status "${user?.retailStatus ?? "unknown"}" does not allow token activation. Only registered retail accounts can activate.`,
    };
  }

  const token = String(formData.get("token") || "").trim();

  if (!token) {
    return {
      status: "error",
      message: "Masukkan token aktivasi ritel.",
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
      message: "The token is invalid, already used, expired, revoked, or not assigned to your account.",
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
      message: "The token is invalid, already used, expired, revoked, or not assigned to your account.",
    };
  }

  revalidatePath("/retail/activate");

  return {
    status: "success",
    message: "Your retail account has been activated. You can now view retail prices and retail vouchers.",
  };
}
