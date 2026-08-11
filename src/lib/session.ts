import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

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

/**
 * Get the current user from the session, deduplicated per request via React.cache().
 *
 * Better Auth's getSession already returns user fields including additionalFields
 * (role, retailStatus etc.), so we skip an extra DB query.  Guest users return
 * null without any database roundtrip.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return null;

    // Better Auth returns all additionalFields (role, retailStatus) on the user
    // object — no need for a redundant db.user.findUnique().
    const u = session.user as {
      id: string;
      name: string | null;
      email: string | null;
      role: string | null;
      retailStatus: string | null;
    };
    return {
      id: u.id,
      name: u.name ?? null,
      email: u.email ?? null,
      role: u.role ?? null,
      retailStatus: u.retailStatus ?? null,
    };
  } catch {
    return null;
  }
});
