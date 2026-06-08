import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { resolveStoreWhatsappNumber, buildWhatsappUrl } from "@/lib/whatsapp";

// Node.js runtime: the in-memory rate-limit store requires a persistent process.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, RATE_LIMITS.retailWhatsapp);
  if (!rateLimit.success) return tooManyRequests(rateLimit);

  const featureEnabled = await isFeatureEnabled("enable_retail_whatsapp_request");
  if (!featureEnabled) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Retail WhatsApp request is currently disabled." }, { status: 403 }),
      rateLimit,
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Please log in first." }, { status: 401 }),
      rateLimit,
    );
  }

  if (user.role !== "USER") {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Only retail users can request token via WhatsApp." }, { status: 403 }),
      rateLimit,
    );
  }

  const db = getDb();
  const retailUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      whatsappNumber: true,
      storeName: true,
      userCode: true,
      retailStatus: true,
    },
  });

  if (!retailUser) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "User not found." }, { status: 404 }),
      rateLimit,
    );
  }

  if (retailUser.retailStatus !== "REGISTERED" && retailUser.retailStatus !== "PENDING_RETAIL") {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: `Your account status is "${retailUser.retailStatus}". Token requests are only allowed for registered retail accounts.` },
        { status: 400 },
      ),
      rateLimit,
    );
  }

  if (retailUser.retailStatus === "REGISTERED") {
    await db.user.update({
      where: { id: user.id },
      data: { retailStatus: "PENDING_RETAIL" },
    });
  }

  const waNumber = await resolveStoreWhatsappNumber(db);

  const message = [
    "Halo Admin, saya ingin meminta OTP aktivasi retail.",
    "",
    `Nama: ${retailUser.name ?? "-"}`,
    `Email: ${retailUser.email ?? "-"}`,
    `WhatsApp: ${retailUser.whatsappNumber ?? "-"}`,
    `Toko/Instansi: ${retailUser.storeName ?? "-"}`,
    `Kode Pengguna: ${retailUser.userCode ?? "-"}`,
    "",
    "Mohon bantu buatkan OTP aktivasi retail.",
  ].join("\n");

  const waUrl = buildWhatsappUrl({ message, whatsappNumber: waNumber });

  return applyRateLimitHeaders(NextResponse.json({ waUrl }), rateLimit);
}
