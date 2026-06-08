import { getDb } from "@/lib/db";
import { requireSuperAdminSession } from "@/lib/admin-auth";
import FeatureFlagsClient, { type FeatureFlagView } from "./FeatureFlagsClient";

export const dynamic = "force-dynamic";

const standardFlags: Array<Omit<FeatureFlagView, "enabled" | "flagId">> = [
  { key: "enable_promo_banner", name: "Promo Banner", group: "Public Catalog", description: "Tampilkan banner promo di halaman publik." },
  { key: "enable_hero_banner", name: "Hero Banner", group: "Public Catalog", description: "Aktifkan carousel hero di halaman utama." },
  { key: "enable_saved_products", name: "Saved Products", group: "Public Catalog", description: "Aktifkan fitur simpan produk berbasis localStorage." },
  { key: "enable_product_import", name: "Product Import", group: "Product", description: "Izinkan impor produk massal." },
  { key: "enable_margin_management", name: "Margin Management", group: "Product", description: "Izinkan konfigurasi margin harga admin." },
  { key: "enable_flash_sale", name: "Flash Sale", group: "Product", description: "Aktifkan modul flash sale produk." },
  { key: "enable_public_voucher", name: "Public Voucher", group: "Promo/Voucher", description: "Tampilkan dan izinkan voucher publik." },
  { key: "enable_retail_voucher", name: "Retail Voucher", group: "Promo/Voucher", description: "Tampilkan voucher khusus akun ritel aktif." },
  { key: "enable_voucher_claim", name: "Voucher Claim", group: "Promo/Voucher", description: "Izinkan pengguna mengklaim voucher." },
  { key: "enable_retail_registration", name: "Retail Registration", group: "Retail", description: "Izinkan pendaftaran akun ritel.", critical: true },
  { key: "enable_retail_token_activation", name: "Retail OTP Activation", group: "Retail", description: "Izinkan aktivasi ritel menggunakan OTP 6 digit.", critical: true },
  { key: "enable_retail_price", name: "Retail Price", group: "Retail", description: "Tampilkan harga ritel ke pengguna ritel aktif." },
  { key: "enable_retail_whatsapp_request", name: "Retail WhatsApp Request", group: "WhatsApp", description: "Izinkan permintaan OTP ritel lewat WhatsApp." },
  { key: "enable_inquiry_tracking", name: "Inquiry Tracking", group: "WhatsApp", description: "Simpan log inquiry WhatsApp ke database." },
  { key: "enable_whatsapp_cta", name: "WhatsApp CTA", group: "WhatsApp", description: "Tampilkan CTA WhatsApp pada kartu dan detail produk." },
  { key: "enable_reports", name: "Reports", group: "Reports", description: "Aktifkan modul laporan admin." },
  { key: "enable_csv_export", name: "CSV Export", group: "Reports", description: "Izinkan ekspor CSV laporan bisnis." },
  { key: "enable_admin_activity_log", name: "Admin Activity Log", group: "Admin", description: "Catat aktivitas admin dan super admin." },
  { key: "enable_store_settings", name: "Store Settings", group: "Admin", description: "Izinkan perubahan identitas dan kontak toko." },
  { key: "enable_admin_user_management", name: "Admin User Management", group: "Super Admin", description: "Izinkan manajemen akun admin.", critical: true },
  { key: "enable_feature_flags", name: "Feature Flags", group: "Super Admin", description: "Izinkan perubahan feature flags.", critical: true },
  { key: "enable_maintenance_mode", name: "Maintenance Mode", group: "System", description: "Aktifkan mode maintenance situs publik.", critical: true },
  { key: "enable_system_health", name: "System Health", group: "System", description: "Tampilkan halaman status sistem super admin." },
];

export default async function FeatureFlagsPage() {
  await requireSuperAdminSession();
  const db = getDb();

  const existingFlags = await db.featureFlag.findMany({
    orderBy: { key: "asc" },
    select: { id: true, key: true, name: true, description: true, enabled: true },
  });

  const knownKeys = new Set(standardFlags.map((flag) => flag.key));
  const existingMap = new Map(existingFlags.map((flag) => [flag.key, flag]));

  const knownFlags: FeatureFlagView[] = standardFlags.map((flag) => {
    const dbFlag = existingMap.get(flag.key);
    return {
      ...flag,
      enabled: dbFlag?.enabled ?? false,
      flagId: dbFlag?.id ?? null,
    };
  });

  const customFlags: FeatureFlagView[] = existingFlags
    .filter((flag) => !knownKeys.has(flag.key))
    .map((flag) => ({
      key: flag.key,
      name: flag.name,
      description: flag.description,
      group: "System",
      enabled: flag.enabled,
      flagId: flag.id,
    }));

  return <FeatureFlagsClient flags={[...knownFlags, ...customFlags]} />;
}
