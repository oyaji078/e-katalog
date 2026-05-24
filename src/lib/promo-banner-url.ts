function hasBlockedProtocol(value: string): boolean {
  const normalized = value.trim().toLowerCase().replace(/[\u0000-\u001f\u007f\s]+/g, "");
  return (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("vbscript:")
  );
}

export function isRenderablePromoBannerImageUrl(value: string | null | undefined): value is string {
  if (!value) return false;

  const trimmed = value.trim();
  if (!trimmed || hasBlockedProtocol(trimmed)) return false;

  if (trimmed.startsWith("/")) {
    return trimmed.startsWith("/uploads/") && !trimmed.startsWith("//") && !trimmed.includes("\\");
  }

  return false;
}
