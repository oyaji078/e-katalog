import { statSync } from "node:fs";
import path from "node:path";

const publicDir = path.resolve(process.cwd(), "public");

function isPathInside(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return relative === "" || (!!relative && !relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveLocalPublicAssetPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, "http://local.invalid");
    if (parsed.origin !== "http://local.invalid") return null;

    const decodedPathname = decodeURIComponent(parsed.pathname);
    if (!decodedPathname || decodedPathname.includes("\0")) return null;

    const relativePath = decodedPathname.replace(/^\/+/, "");
    if (!relativePath) return null;

    const resolved = path.resolve(publicDir, relativePath);
    return isPathInside(publicDir, resolved) ? resolved : null;
  } catch {
    return null;
  }
}

function isExistingPublicFile(filePath: string) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export function isValidBrandLogoUrl(value: string) {
  const trimmed = value.trim();
  if (!/^\/uploads\/brands\/brand-[a-f0-9]{8}\.webp$/.test(trimmed)) {
    return false;
  }

  const localPath = resolveLocalPublicAssetPath(trimmed);
  return localPath ? isExistingPublicFile(localPath) : false;
}

export function safeBrandLogoSrc(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isValidBrandLogoUrl(trimmed) ? trimmed : null;
}
