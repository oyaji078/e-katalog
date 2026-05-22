import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { resolveStoreWhatsappNumber, buildWhatsappUrl } from "@/lib/whatsapp";

export async function POST() {
  const featureEnabled = await isFeatureEnabled("enable_retail_whatsapp_request");
  if (!featureEnabled) {
    return NextResponse.json({ error: "Retail WhatsApp request is currently disabled." }, { status: 403 });
  }

  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const userRole = session.user.role ?? "USER";
  if (userRole !== "USER") {
    return NextResponse.json({ error: "Only retail users can request token via WhatsApp." }, { status: 403 });
  }

  const db = getDb();
  const user = await db.user.findUnique({
    where: { id: userId },
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

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.retailStatus !== "REGISTERED" && user.retailStatus !== "PENDING_RETAIL") {
    return NextResponse.json(
      { error: `Your account status is "${user.retailStatus}". Token requests are only allowed for registered retail accounts.` },
      { status: 400 },
    );
  }

  if (user.retailStatus === "REGISTERED") {
    await db.user.update({
      where: { id: userId },
      data: { retailStatus: "PENDING_RETAIL" },
    });
  }

  const waNumber = await resolveStoreWhatsappNumber(db);

  const message = [
    "Halo Admin, saya ingin meminta token aktivasi retail.",
    "",
    `Nama: ${user.name ?? "-"}`,
    `Email: ${user.email ?? "-"}`,
    `WhatsApp: ${user.whatsappNumber ?? "-"}`,
    `Toko/Instansi: ${user.storeName ?? "-"}`,
    `Kode Pengguna: ${user.userCode ?? "-"}`,
    "",
    "Mohon bantu buatkan token aktivasi retail.",
  ].join("\n");

  const waUrl = buildWhatsappUrl({ message, whatsappNumber: waNumber });

  return NextResponse.json({ waUrl });
}
