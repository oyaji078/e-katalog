import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { resolveStoreWhatsappNumber, buildWhatsappUrl } from "@/lib/whatsapp";

export async function POST() {
  const featureEnabled = await isFeatureEnabled("enable_retail_whatsapp_request");
  if (!featureEnabled) {
    return NextResponse.json({ error: "Retail WhatsApp request is currently disabled." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  if (user.role !== "USER") {
    return NextResponse.json({ error: "Only retail users can request token via WhatsApp." }, { status: 403 });
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
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (retailUser.retailStatus !== "REGISTERED" && retailUser.retailStatus !== "PENDING_RETAIL") {
    return NextResponse.json(
      { error: `Your account status is "${retailUser.retailStatus}". Token requests are only allowed for registered retail accounts.` },
      { status: 400 },
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
    "Halo Admin, saya ingin meminta token aktivasi retail.",
    "",
    `Nama: ${retailUser.name ?? "-"}`,
    `Email: ${retailUser.email ?? "-"}`,
    `WhatsApp: ${retailUser.whatsappNumber ?? "-"}`,
    `Toko/Instansi: ${retailUser.storeName ?? "-"}`,
    `Kode Pengguna: ${retailUser.userCode ?? "-"}`,
    "",
    "Mohon bantu buatkan token aktivasi retail.",
  ].join("\n");

  const waUrl = buildWhatsappUrl({ message, whatsappNumber: waNumber });

  return NextResponse.json({ waUrl });
}
