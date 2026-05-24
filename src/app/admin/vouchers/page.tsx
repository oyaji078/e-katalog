import { redirect } from "next/navigation";

export default function VouchersPage() {
  redirect("/admin/promo-vouchers?tab=vouchers");
}
