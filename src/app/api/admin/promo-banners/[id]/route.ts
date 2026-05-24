import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { deleteProductImage, isLocalUploadPath } from "@/lib/upload/storage";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const banner = await db.promoBanner.findUnique({ where: { id } });
  if (!banner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (banner.imageUrl && isLocalUploadPath(banner.imageUrl)) {
    deleteProductImage(banner.imageUrl);
  }

  await db.promoBanner.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
