/**
 * Mask a sensitive token / OTP for display in admin reports and CSV exports.
 *
 * Reveals at most the last 2 characters — never the full value. The raw OTP is
 * a live credential (RetailToken.tokenPreview); it must not appear in historical
 * or exportable reports where the audit trail could leak the active code.
 */
export function maskToken(token: string | null | undefined): string {
  if (!token) return "—";
  const value = String(token).trim();
  if (value.length <= 2) return "****";
  return `****${value.slice(-2)}`;
}
