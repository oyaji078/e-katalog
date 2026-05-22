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

  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    return {
      status: "error",
      message: "Please enter a retail activation token.",
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

  await db.$transaction([
    db.retailToken.update({
      where: { id: tokenRecord.id },
      data: {
        status: "USED",
        usedAt: now,
      },
    }),
     db.user.update({
       where: { id: userId },
       data: {
         retailStatus: "RETAIL_ACTIVE",
       },
     }),
  ]);

  revalidatePath("/retail/activate");

  return {
    status: "success",
    message: "Your retail account has been activated. You can now view retail prices and retail vouchers.",
  };
}
