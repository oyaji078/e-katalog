import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    let body: { voucherId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ status: "error", message: "Invalid request body" }, { status: 400 });
    }

    const { voucherId } = body;
    if (!voucherId) {
      return NextResponse.json({ status: "error", message: "Voucher ID is required" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ status: "error", message: "Silakan login terlebih dahulu untuk klaim voucher." }, { status: 401 });
    }

    const db = getDb();

    const voucher = await db.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      return NextResponse.json({ status: "error", message: "Voucher tidak ditemukan." }, { status: 404 });
    }

    if (!voucher.isActive || voucher.status !== "ACTIVE") {
      return NextResponse.json({ status: "error", message: "Voucher tidak aktif." }, { status: 400 });
    }

    const now = new Date();
    if (voucher.startsAt > now || voucher.endsAt < now) {
      return NextResponse.json({ status: "error", message: "Voucher sudah tidak berlaku." }, { status: 400 });
    }

    const publicVoucherEnabled = await isFeatureEnabled("enable_public_voucher");
    const retailVoucherEnabled = await isFeatureEnabled("enable_retail_voucher");

    const isRetailUser = user.retailStatus === "RETAIL_ACTIVE";

    if (voucher.showForPublic && !isRetailUser && !publicVoucherEnabled) {
      return NextResponse.json({ status: "error", message: "Voucher publik sedang tidak tersedia." }, { status: 403 });
    }

    if (voucher.showForRetail || isRetailUser) {
      if (voucher.showForRetail && !retailVoucherEnabled) {
        return NextResponse.json({ status: "error", message: "Voucher retail sedang tidak tersedia." }, { status: 403 });
      }
      if (voucher.showForRetail && !isRetailUser) {
        return NextResponse.json({ status: "error", message: "Voucher retail hanya untuk akun retail aktif." }, { status: 403 });
      }
    }

    // Atomic claim: serialize concurrent claims for this voucher via a row
    // lock so the quota check and the insert cannot race. Duplicate per-user
    // claims are additionally guarded by the @@unique([voucherId, userId])
    // constraint. No order/checkout logic — a claim is purely informational.
    const outcome = await db.$transaction(async (tx) => {
      // Lock the voucher row for the duration of the transaction. Parameterized
      // (voucherId is bound, not interpolated) — no injection surface.
      await tx.$queryRaw`SELECT id FROM \`Voucher\` WHERE id = ${voucherId} FOR UPDATE`;

      const existingClaim = await tx.voucherClaim.findUnique({
        where: { voucherId_userId: { voucherId, userId: user.id } },
      });

      if (existingClaim) {
        return existingClaim.status === "CLAIMED"
          ? ({ code: "ALREADY_CLAIMED" } as const)
          : ({ code: "UNAVAILABLE" } as const);
      }

      const claimCount = await tx.voucherClaim.count({
        where: { voucherId, status: "CLAIMED" },
      });

      if (claimCount >= voucher.usageQuota) {
        return { code: "QUOTA_FULL" } as const;
      }

      await tx.voucherClaim.create({
        data: {
          voucherId,
          userId: user.id,
          status: "CLAIMED",
          claimedAt: now,
        },
      });

      return { code: "CLAIMED" } as const;
    });

    if (outcome.code === "ALREADY_CLAIMED") {
      return NextResponse.json({ status: "error", message: "Anda sudah mengklaim voucher ini." }, { status: 409 });
    }
    if (outcome.code === "UNAVAILABLE") {
      return NextResponse.json({ status: "error", message: "Voucher sudah tidak dapat diklaim." }, { status: 409 });
    }
    if (outcome.code === "QUOTA_FULL") {
      return NextResponse.json({ status: "error", message: "Kuota voucher sudah habis." }, { status: 400 });
    }

    return NextResponse.json({
      status: "success",
      message: `Voucher "${voucher.title}" berhasil diklaim!`,
    });
  } catch {
    return NextResponse.json({ status: "error", message: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 });
  }
}
