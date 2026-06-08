import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PromoBannersPage() {
  redirect("/admin/promo-vouchers?tab=banners");
}
