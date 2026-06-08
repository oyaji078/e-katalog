// Super-admin reports live under the /super-admin URL space so a SUPER_ADMIN
// who opens "Laporan" stays inside the super-admin shell (sidebar/topbar)
// instead of being sent into /admin. The view itself is identical to the admin
// report, so we reuse the admin page component verbatim. Access is enforced
// twice: the super-admin layout (requireSuperAdminSession) gates the route, and
// the reused page's own requireAdmin() also admits SUPER_ADMIN.
export { default } from "@/app/admin/reports/page";

export const dynamic = "force-dynamic";
