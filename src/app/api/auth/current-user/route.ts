import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();

  const body = user
    ? {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          retailStatus: user.retailStatus,
        },
      }
    : { user: null };

  return NextResponse.json(body, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
