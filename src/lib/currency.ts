export function formatIndonesianNumber(value: number | string): string {
  const num = typeof value === "string" ? parseIndonesianNumber(value) : value;
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("id-ID");
}

export function parseIndonesianNumber(value: string): number {
  const cleaned = value
    .replace(/[Rr][Pp]\s*/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatRupiah(value: number | string): string {
  const num = typeof value === "string" ? parseIndonesianNumber(value) : value;
  if (!Number.isFinite(num)) return "Rp 0";
  return `Rp ${num.toLocaleString("id-ID")}`;
}

export function sanitizeNumericInput(value: string): string {
  return value.replace(/[^0-9.]/g, "");
}

export function parseIDRInput(value: string | null | undefined): number | null {
  const cleaned = String(value ?? "")
    .replace(/[Rr][Pp]\s*/g, "")
    .replace(/\./g, "")
    .replace(/,/g, "")
    .replace(/[^\d]/g, "");

  if (!cleaned) return null;

  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatIDRInput(value: number | string | null | undefined): string {
  const parsed = typeof value === "number" ? value : parseIDRInput(value);
  if (!parsed || parsed < 0) return "";
  return parsed.toLocaleString("id-ID");
}
