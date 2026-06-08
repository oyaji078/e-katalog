import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function VouchersPage() {
  redirect("/admin/promo-vouchers?tab=vouchers");
}
