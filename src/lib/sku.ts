import { getDb } from "@/lib/db";

function cleanInitial(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase())
    .join("")
    .substring(0, 4);
}

export function makeSkuPrefix(categoryName: string, brandName: string): string {
  const cat = cleanInitial(categoryName);
  const brd = cleanInitial(brandName);
  if (!cat || !brd) throw new Error("Kategori dan merek harus diisi.");
  return `${cat}-${brd}`;
}

export async function getNextSkuSequence(prefix: string): Promise<number> {
  const db = getDb();
  const existing = await db.product.findMany({
    where: { sku: { startsWith: prefix + "-" } },
    select: { sku: true },
  });
  let maxSeq = 0;
  for (const p of existing) {
    const parts = p.sku.split("-");
    const num = Number.parseInt(parts[parts.length - 1], 10);
    if (Number.isFinite(num) && num > maxSeq) maxSeq = num;
  }
  return maxSeq + 1;
}

export async function generateProductSku(categoryName: string, brandName: string): Promise<string> {
  const prefix = makeSkuPrefix(categoryName, brandName);
  const seq = await getNextSkuSequence(prefix);
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export async function generateUniqueProductSku(
  categoryName: string,
  brandName: string,
  maxRetries = 5,
): Promise<string> {
  const prefix = makeSkuPrefix(categoryName, brandName);
  const db = getDb();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const seq = await getNextSkuSequence(prefix);
    const sku = `${prefix}-${String(seq).padStart(4, "0")}`;

    const existing = await db.product.findUnique({ where: { sku }, select: { id: true } });
    if (!existing) return sku;
  }

  throw new Error("Gagal membuat kode produk unik. Coba simpan kembali.");
}
