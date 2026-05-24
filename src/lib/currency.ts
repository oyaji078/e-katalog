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
