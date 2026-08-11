"use server";

import { headers } from "next/headers";

import { AnalyticsEventType } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { isFeatureEnabled } from "@/lib/feature-flags";

export type RegisterState = {
  success: boolean;
  error?: string;
  userCode?: string;
};

export async function checkRegistrationEnabled(): Promise<boolean> {
  return isFeatureEnabled("enable_retail_registration");
}

export async function registerUserAction(formData: FormData): Promise<RegisterState> {
  const registrationEnabled = await isFeatureEnabled("enable_retail_registration");
  if (!registrationEnabled) {
    return { success: false, error: "Registrasi retail saat ini ditutup." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const whatsappNumber = String(formData.get("whatsappNumber") ?? "").trim();
  const storeName = String(formData.get("storeName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!name) return { success: false, error: "Nama lengkap harus diisi." };
  if (!email) return { success: false, error: "Email harus diisi." };
  if (!password || password.length < 8) {
    return { success: false, error: "Password minimal 8 karakter." };
  }
  if (password !== confirmPassword) {
    return { success: false, error: "Password dan konfirmasi password tidak sama." };
  }
  if (!whatsappNumber) {
    return { success: false, error: "Nomor WhatsApp harus diisi." };
  }

  try {
    const hdrs = await headers();
    // Pass the retail profile fields directly to Better Auth so the user row is
    // created complete in a single transaction. A separate post-signup update
    // left a window where the account existed without its profile data and
    // added an extra query on every registration.
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        whatsappNumber,
        storeName,
        address,
      } as NonNullable<Parameters<typeof auth.api.signUpEmail>[0]>["body"],
      headers: hdrs,
      asResponse: false,
    });

    if (!result?.user) {
      return { success: false, error: "Registrasi gagal. Silakan coba lagi." };
    }

    await trackAnalyticsEvent({
      type: AnalyticsEventType.RETAIL_REGISTER,
      userId: result.user.id,
      phone: whatsappNumber,
      metadata: { hasStoreName: Boolean(storeName) },
    });

    return {
      success: true,
      userCode: result.user.userCode as string | undefined,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registrasi gagal. Silakan coba lagi.";
    return { success: false, error: message };
  }
}
