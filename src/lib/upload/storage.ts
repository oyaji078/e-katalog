import { createHash, randomBytes } from "node:crypto";
import { unlinkSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PRODUCT_UPLOAD_DIR = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  "public",
  "uploads",
  "products",
);
const PROMO_BANNER_UPLOAD_DIR = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  "public",
  "uploads",
  "promo-banners",
);
const SITE_UPLOAD_DIR = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  "public",
  "uploads",
  "site",
);

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_SITE_UPLOAD_SIZE = 2 * 1024 * 1024; // 2 MB

export function ensureUploadDirectory(uploadDir = PRODUCT_UPLOAD_DIR): void {
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return "Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP.";
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return "Ukuran file maksimal 5 MB.";
  }
  return null;
}

export function validateSiteImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return "Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP.";
  }
  if (file.size > MAX_SITE_UPLOAD_SIZE) {
    return "Ukuran file maksimal 2 MB.";
  }
  return null;
}

export function sanitizeFilename(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const base = path.basename(original, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = randomBytes(4).toString("hex");
  return `${base}-${suffix}${ext}`;
}

export async function saveProductImage(file: File): Promise<string> {
  return saveImageFile(file, PRODUCT_UPLOAD_DIR, "/uploads/products");
}

export async function savePromoBannerImage(file: File): Promise<string> {
  return saveImageFile(file, PROMO_BANNER_UPLOAD_DIR, "/uploads/promo-banners");
}

export async function saveSiteImage(file: File, kind: "logo" | "favicon"): Promise<string> {
  const error = validateSiteImageFile(file);
  if (error) throw new Error(error);

  ensureUploadDirectory(SITE_UPLOAD_DIR);

  const suffix = randomBytes(4).toString("hex");
  const fileName = `${kind}-${suffix}.webp`;
  const filePath = path.join(SITE_UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const webp = await sharp(buffer).webp({ quality: 90 }).toBuffer();
    writeFileSync(filePath, webp);
  } catch {
    throw new Error("Gambar gagal diproses. Pastikan file gambar valid.");
  }

  return `/uploads/site/${fileName}`;
}

async function saveImageFile(file: File, uploadDir: string, publicBasePath: string): Promise<string> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  ensureUploadDirectory(uploadDir);

  const sanitized = sanitizeFilename(file.name);
  const filePath = path.join(uploadDir, sanitized);

  if (existsSync(filePath)) {
    const hash = createHash("md5").update(randomBytes(8)).digest("hex").substring(0, 8);
    const ext = path.extname(sanitized);
    const base = path.basename(sanitized, ext);
    const deduped = path.join(uploadDir, `${base}-${hash}${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(deduped, buffer);
    return `${publicBasePath}/${path.basename(deduped)}`;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(filePath, buffer);
  return `${publicBasePath}/${sanitized}`;
}

export function deleteProductImage(publicPath: string): void {
  if (!isLocalUploadPath(publicPath)) return;
  const absolutePath = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    "public",
    publicPath.replace(/^\//, ""),
  );
  if (existsSync(absolutePath)) {
    try {
      unlinkSync(absolutePath);
    } catch {
      // Silently ignore delete failures
    }
  }
}

export function deletePromoBannerImage(publicPath: string): void {
  if (!isLocalPromoBannerUploadPath(publicPath)) return;
  const absolutePath = resolvePublicUploadPath(publicPath);
  if (absolutePath && existsSync(absolutePath)) {
    try {
      unlinkSync(absolutePath);
    } catch {
      // Best-effort cleanup; DB mutation must remain authoritative.
    }
  }
}

export function deleteSiteImage(publicPath: string): void {
  if (!isLocalSiteUploadPath(publicPath)) return;
  const absolutePath = resolvePublicUploadPath(publicPath);
  if (absolutePath && existsSync(absolutePath)) {
    try {
      unlinkSync(absolutePath);
    } catch {
      // Best-effort cleanup; DB mutation must remain authoritative.
    }
  }
}

export function isLocalUploadPath(value: string): boolean {
  if (!value) return false;
  return value.startsWith("/uploads/products/");
}

export function isLocalPromoBannerUploadPath(value: string): boolean {
  if (!value) return false;
  return value.startsWith("/uploads/promo-banners/");
}

export function isLocalSiteUploadPath(value: string): boolean {
  if (!value) return false;
  return /^\/uploads\/site\/(?:logo|favicon)-[a-f0-9]{8}\.webp$/.test(value);
}

function isPathInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!!relative && !relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolvePublicUploadPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, "http://local.invalid");
    if (parsed.origin !== "http://local.invalid") return null;

    const decodedPathname = decodeURIComponent(parsed.pathname);
    if (!decodedPathname.startsWith("/uploads/") || decodedPathname.includes("\0")) {
      return null;
    }

    const publicDir = path.resolve(/* turbopackIgnore: true */ process.cwd(), "public");
    const absolutePath = path.resolve(publicDir, decodedPathname.replace(/^\/+/, ""));
    return isPathInside(publicDir, absolutePath) ? absolutePath : null;
  } catch {
    return null;
  }
}

function isExistingPublicFile(value: string): boolean {
  const absolutePath = resolvePublicUploadPath(value);
  if (!absolutePath) return false;

  try {
    return statSync(absolutePath).isFile();
  } catch {
    return false;
  }
}

function hasBlockedProtocol(value: string): boolean {
  const normalized = value.trim().toLowerCase().replace(/[\u0000-\u001f\u007f\s]+/g, "");
  return (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("vbscript:")
  );
}

export function isSafePromoBannerImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || hasBlockedProtocol(trimmed)) return false;

  if (trimmed.startsWith("/")) {
    return trimmed.startsWith("/uploads/") && isExistingPublicFile(trimmed);
  }

  return false;
}

export function isSafeSiteImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || hasBlockedProtocol(trimmed)) return false;
  return isLocalSiteUploadPath(trimmed) && isExistingPublicFile(trimmed);
}
