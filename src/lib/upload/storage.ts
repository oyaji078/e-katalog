import { randomBytes } from "node:crypto";
import { unlinkSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const PUBLIC_UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
const PRODUCT_UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ PUBLIC_UPLOAD_DIR, "products");
const PROMO_BANNER_UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ PUBLIC_UPLOAD_DIR, "promo-banners");
const SITE_UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ PUBLIC_UPLOAD_DIR, "site");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_SITE_UPLOAD_SIZE = 2 * 1024 * 1024; // 2 MB

export function ensureUploadDirectory(uploadDir = PRODUCT_UPLOAD_DIR): void {
  if (!existsSync(/*turbopackIgnore: true*/ uploadDir)) {
    mkdirSync(/*turbopackIgnore: true*/ uploadDir, { recursive: true });
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

// Magic-byte signatures for the allowed image types. file.type (the declared
// MIME) is client-controlled, so we also verify the real file header before
// writing/processing. The subsequent sharp re-encode is a second line of defense.
const IMAGE_MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // "RIFF" container (WebP)
};

export function assertImageMagicBytes(buffer: Buffer, declaredType: string): void {
  const signatures = IMAGE_MAGIC_BYTES[declaredType];
  if (!signatures) {
    throw new Error("Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP.");
  }
  const matches = signatures.some((sig) => sig.every((byte, index) => buffer[index] === byte));
  if (!matches) {
    throw new Error("Isi file tidak cocok dengan tipe gambar yang dinyatakan.");
  }
}

async function saveImageAsWebp(
  file: File,
  uploadDir: string,
  publicBasePath: string,
  prefix: string,
  maxSize: number,
): Promise<string> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);
  if (file.size > maxSize) {
    throw new Error("Ukuran file terlalu besar.");
  }

  ensureUploadDirectory(uploadDir);

  const suffix = randomBytes(4).toString("hex");
  const fileName = `${prefix}-${suffix}.webp`;
  const filePath = path.join(/*turbopackIgnore: true*/ uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  assertImageMagicBytes(buffer, file.type);

  try {
    const sharp = (await import("sharp")).default;
    const webp = await sharp(buffer).webp({ quality: 90 }).toBuffer();
    writeFileSync(/*turbopackIgnore: true*/ filePath, webp);
  } catch {
    throw new Error("Gambar gagal diproses. Pastikan file gambar valid.");
  }

  return `${publicBasePath}/${fileName}`;
}

export async function saveProductImage(file: File): Promise<string> {
  return saveImageAsWebp(file, PRODUCT_UPLOAD_DIR, "/uploads/products", "product", MAX_UPLOAD_SIZE);
}

export async function savePromoBannerImage(file: File): Promise<string> {
  return saveImageAsWebp(file, PROMO_BANNER_UPLOAD_DIR, "/uploads/promo-banners", "promo", MAX_UPLOAD_SIZE);
}

export async function saveSiteImage(file: File, kind: "logo" | "favicon"): Promise<string> {
  return saveImageAsWebp(file, SITE_UPLOAD_DIR, "/uploads/site", kind, MAX_SITE_UPLOAD_SIZE);
}

export function deleteProductImage(publicPath: string): void {
  if (!isLocalUploadPath(publicPath)) return;
  const absolutePath = resolvePublicUploadPath(publicPath);
  if (absolutePath && existsSync(/*turbopackIgnore: true*/ absolutePath)) {
    try {
      unlinkSync(/*turbopackIgnore: true*/ absolutePath);
    } catch {
      // Silently ignore delete failures
    }
  }
}

export function deletePromoBannerImage(publicPath: string): void {
  if (!isLocalPromoBannerUploadPath(publicPath)) return;
  const absolutePath = resolvePublicUploadPath(publicPath);
  if (absolutePath && existsSync(/*turbopackIgnore: true*/ absolutePath)) {
    try {
      unlinkSync(/*turbopackIgnore: true*/ absolutePath);
    } catch {
      // Best-effort cleanup; DB mutation must remain authoritative.
    }
  }
}

const CATEGORY_UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ PUBLIC_UPLOAD_DIR, "categories");

export async function saveCategoryImage(file: File): Promise<string> {
  return saveImageAsWebp(file, CATEGORY_UPLOAD_DIR, "/uploads/categories", "category", MAX_SITE_UPLOAD_SIZE);
}

export function deleteCategoryImage(publicPath: string): void {
  if (!isLocalCategoryUploadPath(publicPath)) return;
  const absolutePath = resolvePublicUploadPath(publicPath);
  if (absolutePath && existsSync(/*turbopackIgnore: true*/ absolutePath)) {
    try {
      unlinkSync(/*turbopackIgnore: true*/ absolutePath);
    } catch {
      // Best-effort cleanup
    }
  }
}

function isLocalCategoryUploadPath(value: string): boolean {
  if (!value) return false;
  return value.startsWith("/uploads/categories/");
}

const BRAND_UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ PUBLIC_UPLOAD_DIR, "brands");

export async function saveBrandImage(file: File): Promise<string> {
  return saveImageAsWebp(file, BRAND_UPLOAD_DIR, "/uploads/brands", "brand", MAX_SITE_UPLOAD_SIZE);
}

export function deleteBrandImage(publicPath: string): void {
  if (!isLocalBrandUploadPath(publicPath)) return;
  const absolutePath = resolvePublicUploadPath(publicPath);
  if (absolutePath && existsSync(/*turbopackIgnore: true*/ absolutePath)) {
    try {
      unlinkSync(/*turbopackIgnore: true*/ absolutePath);
    } catch {
      // Best-effort cleanup
    }
  }
}

function isLocalBrandUploadPath(value: string): boolean {
  if (!value) return false;
  return /^\/uploads\/brands\/brand-[a-f0-9]{8}\.webp$/.test(value);
}

export function deleteSiteImage(publicPath: string): void {
  if (!isLocalSiteUploadPath(publicPath)) return;
  const absolutePath = resolvePublicUploadPath(publicPath);
  if (absolutePath && existsSync(/*turbopackIgnore: true*/ absolutePath)) {
    try {
      unlinkSync(/*turbopackIgnore: true*/ absolutePath);
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

    const uploadRelativePath = decodedPathname.replace(/^\/uploads\/+/, "");
    const absolutePath = path.resolve(/*turbopackIgnore: true*/ PUBLIC_UPLOAD_DIR, uploadRelativePath);
    return isPathInside(PUBLIC_UPLOAD_DIR, absolutePath) ? absolutePath : null;
  } catch {
    return null;
  }
}

function isExistingPublicFile(value: string): boolean {
  const absolutePath = resolvePublicUploadPath(value);
  if (!absolutePath) return false;

  try {
    return statSync(/*turbopackIgnore: true*/ absolutePath).isFile();
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
