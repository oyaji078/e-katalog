import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export default async function AdminGenerateTokenPage() {
  await requireAdmin();
  redirect("/admin/retail-users");
}
