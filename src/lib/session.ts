import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function getCurrentSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export type CurrentUser = {
  id: string;
  role: string | null;
  name: string | null;
  email: string | null;
  retailStatus: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) return null;

    const db = getDb();
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        retailStatus: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}
