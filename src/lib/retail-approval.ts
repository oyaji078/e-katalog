import { normalizeWhatsappNumber } from "@/lib/site-settings";

export const RETAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function buildRetailApprovalMessage(name: string, token: string) {
  return `Halo ${name}, pendaftaran akun ritel Anda telah disetujui. Kode aktivasi ritel Anda adalah ${token}. Silakan gunakan kode tersebut untuk mengaktifkan akses ritel di e-katalog Rama Komputer.`;
}

export function buildRetailApprovalWhatsappUrl(
  whatsappNumber: string | null | undefined,
  message: string,
) {
  const normalized = normalizeWhatsappNumber(whatsappNumber ?? "");
  if (!normalized) return undefined;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
