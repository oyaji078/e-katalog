"use server";

import { createHash, randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";

import { AnalyticsEventType } from "@/generated/prisma/client";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import { isFeatureEnabled, safeLogAdminActivity } from "@/lib/feature-flags";
import {
  buildRetailApprovalMessage,
  buildRetailApprovalWhatsappUrl,
  RETAIL_TOKEN_TTL_MS,
} from "@/lib/retail-approval";
import { getCurrentUser } from "@/lib/session";

export type RetailUserActionState = {
  success: boolean;
  message: string;
  error: string;
  token?: string;
  waUrl?: string;
  whatsappMessage?: string;
};

const emptyState: RetailUserActionState = {
  success: false,
  message: "",
  error: "",
};

function failure(error: string): RetailUserActionState {
  return { ...emptyState, error };
}

function success(
  message: string,
  options: Pick<RetailUserActionState, "token" | "waUrl" | "whatsappMessage"> = {},
): RetailUserActionState {
  return { ...emptyState, success: true, message, ...options };
}

async function requireActionAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")) {
    return null;
  }
  return currentUser;
}

function userIdFromForm(formData: FormData) {
  return String(formData.get("userId") ?? "").trim();
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function createUniqueNumericToken(
  retailToken: ReturnType<typeof getDb>["retailToken"],
) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const token = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const hash = tokenHash(token);
    const existing = await retailToken.findUnique({
      where: { tokenHash: hash },
      select: { id: true },
    });

    if (!existing) return { token, tokenHash: hash };
  }

  throw new Error("Unable to generate a unique retail activation token.");
}

async function issueRetailActivationToken({
  db,
  currentUser,
  user,
  forceRegenerate = false,
}: {
  db: ReturnType<typeof getDb>;
  currentUser: NonNullable<Awaited<ReturnType<typeof requireActionAdmin>>>;
  user: { id: string; name: string; email: string; whatsappNumber: string | null };
  forceRegenerate?: boolean;
}) {
  const now = new Date();

  return db.$transaction(async (tx) => {
    if (!forceRegenerate) {
      const existingToken = await tx.retailToken.findFirst({
        where: {
          assignedToUserId: user.id,
          status: "ACTIVE",
          usedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        select: { id: true, tokenPreview: true, expiresAt: true },
        orderBy: { createdAt: "desc" },
      });

      if (existingToken) {
        return { token: existingToken.tokenPreview, reused: true, regenerated: false };
      }
    } else {
      await tx.retailToken.updateMany({
        where: {
          assignedToUserId: user.id,
          status: "ACTIVE",
          usedAt: null,
          revokedAt: null,
        },
        data: {
          status: "REVOKED",
          revokedAt: now,
        },
      });
    }

    const generated = await createUniqueNumericToken(tx.retailToken);
    await tx.retailToken.create({
      data: {
        tokenHash: generated.tokenHash,
        tokenPreview: generated.token,
        status: "ACTIVE",
        assignedToUserId: user.id,
        generatedByUserId: currentUser.id,
        expiresAt: new Date(now.getTime() + RETAIL_TOKEN_TTL_MS),
        notes: `Retail activation token for ${user.name} (${user.email})`,
      },
    });

    return { token: generated.token, reused: false, regenerated: forceRegenerate };
  });
}

export async function approveRetailUserAction(
  _previousState: RetailUserActionState,
  formData: FormData,
): Promise<RetailUserActionState> {
  const currentUser = await requireActionAdmin();
  if (!currentUser) return failure("Anda tidak memiliki akses untuk menyetujui pendaftar ritel.");

  const userId = userIdFromForm(formData);
  if (!userId) return failure("Pengguna tidak valid.");

  const featureEnabled = await isFeatureEnabled("enable_retail_token_activation");
  if (!featureEnabled) {
    return failure("Aktivasi kode ritel sedang dinonaktifkan oleh feature flag.");
  }

  const db = getDb();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, whatsappNumber: true, retailStatus: true },
  });

  if (!user) return failure("Pengguna tidak ditemukan.");
  if (user.retailStatus !== "PENDING_RETAIL") {
    return failure("Hanya pendaftar dengan status Menunggu yang dapat disetujui.");
  }

  const tokenResult = await issueRetailActivationToken({ db, currentUser, user });

  // SECURITY: never put the raw activation token (tokenResult.token) in the audit
  // log — it is the active credential. Record only who approved whom + reuse flag.
  await safeLogAdminActivity({
    actorId: currentUser.id,
    actorRole: currentUser.role,
    action: tokenResult.reused ? "Approve retail user with existing token" : "Approve retail user and generate token",
    targetType: "User",
    targetId: user.id,
    risk: "MEDIUM",
    metadata: { userId: user.id, userName: user.name, reused: tokenResult.reused },
  });

  await trackAnalyticsEvent({
    type: AnalyticsEventType.RETAIL_APPROVED,
    userId: user.id,
    phone: user.whatsappNumber ?? undefined,
    metadata: { approvedByUserId: currentUser.id },
  });

  revalidatePath("/admin/retail-users");
  revalidatePath("/admin");

  const message = buildRetailApprovalMessage(user.name, tokenResult.token);
  const waUrl = buildRetailApprovalWhatsappUrl(user.whatsappNumber, message);

  return success("Pendaftar ritel disetujui dan kode aktivasi 6 digit sudah tersedia.", {
    token: tokenResult.token,
    waUrl,
    whatsappMessage: message,
  });
}

export async function generateRetailTokenAction(
  _previousState: RetailUserActionState,
  formData: FormData,
): Promise<RetailUserActionState> {
  const currentUser = await requireActionAdmin();
  if (!currentUser) return failure("Anda tidak memiliki akses untuk membuat token ritel.");

  const userId = userIdFromForm(formData);
  if (!userId) return failure("Pengguna tidak valid.");

  const featureEnabled = await isFeatureEnabled("enable_retail_token_activation");
  if (!featureEnabled) {
    return failure("Aktivasi kode ritel sedang dinonaktifkan oleh feature flag.");
  }

  const db = getDb();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, whatsappNumber: true, retailStatus: true },
  });

  if (!user) return failure("Pengguna tidak ditemukan.");
  if (user.retailStatus !== "REGISTERED" && user.retailStatus !== "PENDING_RETAIL") {
    return failure("Token hanya dapat dibuat untuk akun yang terdaftar atau menunggu aktivasi ritel.");
  }

  const forceRegenerate = String(formData.get("mode") ?? "") === "regenerate";
  const tokenResult = await issueRetailActivationToken({
    db,
    currentUser,
    user,
    forceRegenerate,
  });

  await safeLogAdminActivity({
    actorId: currentUser.id,
    actorRole: currentUser.role,
    action: tokenResult.regenerated
      ? "Regenerate retail token"
      : tokenResult.reused
        ? "Reuse active retail token"
        : "Generate retail token",
    targetType: "User",
    targetId: user.id,
    risk: "MEDIUM",
    metadata: {
      userId: user.id,
      userName: user.name,
      reused: tokenResult.reused,
      regenerated: tokenResult.regenerated,
    },
  });

  revalidatePath("/admin/retail-users");
  revalidatePath("/admin");
  revalidatePath("/retail/activate");

  const message = buildRetailApprovalMessage(user.name, tokenResult.token);
  const waUrl = buildRetailApprovalWhatsappUrl(user.whatsappNumber, message);

  return success(
    tokenResult.regenerated
      ? "Token baru berhasil dibuat. Token aktif sebelumnya dicabut."
      : tokenResult.reused
        ? "Token aktif untuk pengguna ini sudah tersedia."
        : "Token aktivasi 6 digit berhasil dibuat.",
    {
      token: tokenResult.token,
      waUrl,
      whatsappMessage: message,
    },
  );
}

export async function rejectRetailUserAction(
  _previousState: RetailUserActionState,
  formData: FormData,
): Promise<RetailUserActionState> {
  const currentUser = await requireActionAdmin();
  if (!currentUser) return failure("Anda tidak memiliki akses untuk menolak pendaftar ritel.");

  const userId = userIdFromForm(formData);
  if (!userId) return failure("Pengguna tidak valid.");

  const db = getDb();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, retailStatus: true },
  });

  if (!user) return failure("Pengguna tidak ditemukan.");
  if (user.retailStatus !== "PENDING_RETAIL") {
    return failure("Hanya pendaftar dengan status Menunggu yang dapat ditolak.");
  }

  await db.user.update({
    where: { id: user.id },
    data: { retailStatus: "RETAIL_REJECTED" },
  });

  await safeLogAdminActivity({
    actorId: currentUser.id,
    actorRole: currentUser.role,
    action: "Reject retail user",
    targetType: "User",
    targetId: user.id,
    risk: "MEDIUM",
    metadata: { userId: user.id, userName: user.name },
  });

  revalidatePath("/admin/retail-users");
  revalidatePath("/admin");

  return success("Pendaftar ritel berhasil ditolak.");
}
