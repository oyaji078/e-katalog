"use server";

import { createHash, randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
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

export async function generateTokenAction(
  _prevState: GenerateTokenState,
  formData: FormData
): Promise<GenerateTokenState> {
  const userId = String(formData.get("userId") ?? "");
  
  if (!userId) {
    return failure("Please select a user");
  }

  const db = getDb();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  // Verify user is still authenticated
  if (!session?.user || !(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN")) {
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

  if (!(user.retailStatus === "REGISTERED" || user.retailStatus === "PENDING_RETAIL")) {
    return failure("User is not eligible for retail token");
  }

  // Generate secure token
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const tokenPreview = token.substring(0, 8);
  
  // Set expiration (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  try {
    // Create token record
    await db.retailToken.create({
      data: {
        tokenHash,
        tokenPreview,
        status: "ACTIVE",
        assignedToUserId: userId,
        generatedByUserId: session.user.id,
        expiresAt,
        notes: `Generated for user ${user.name} (${user.email})`
      }
    });

    // Log admin activity (respects enable_admin_activity_log flag)
    await safeLogAdminActivity({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "Generate retail token",
      targetType: "User",
      targetId: userId,
      risk: "MEDIUM",
      metadata: { userId, userName: user.name, tokenPreview },
    });

    // Revalidate the page to clear any cached data
    revalidatePath("/admin/generate-token");

    // Return success with token (only shown once)
    return success(
      token,
      `Token generated for ${user.name}. Show this token to the user once.`
    );
  } catch {
    return failure("Failed to generate token. Please try again.");
  }
}
