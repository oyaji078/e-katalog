import { redirect } from "next/navigation";

export default function PromoBannersPage() {
  redirect("/admin/promo-vouchers?tab=banners");
}
