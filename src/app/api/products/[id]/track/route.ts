import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";

type TrackEvent = "view" | "click";

function parseEvent(value: unknown): TrackEvent | null {
  return value === "view" || value === "click" ? value : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "ID produk diperlukan." }, { status: 400 });
  }

  let body: { event?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const event = parseEvent(body.event);
  if (!event) {
    return NextResponse.json({ ok: false, error: "Event tidak valid." }, { status: 400 });
  }

  const db = getDb();
  await db.product.updateMany({
    where: { id, status: "ACTIVE" },
    data: event === "view"
      ? { viewCount: { increment: 1 } }
      : { clickCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
