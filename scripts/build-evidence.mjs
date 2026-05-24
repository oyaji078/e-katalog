import { readdirSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "..", "docs", "ui-audit", "screenshots-phase16");

const roleMap = {
  "home": "public",
  "products": "public",
  "products-paged": "public",
  "product-detail": "public",
  "vouchers": "public",
  "login": "public",
  "register": "public",
  "retail-request-token": "public",
  "retail-activate": "public",
  "admin-products": "admin",
  "super-admin": "super-admin",
  "products-retail": "retail-active",
  "product-detail-retail": "retail-active",
  "vouchers-retail": "retail-active",
};

const files = readdirSync(DIR).filter((f) => f.endsWith(".png"));
const evidence = [];

for (const file of files) {
  const name = file.replace(/\.png$/, "");
  const parts = name.split("-");
  const viewport = parts.pop(); // last part is viewport (e.g. 1366x768)
  const fileBase = parts.join("-");

  // Determine the base name (without viewport suffix)
  let base = fileBase;
  // The file pattern is: <page>-<viewport>.png
  // Reconstruct: remove the last -viewport suffix
  const idx = name.lastIndexOf("-");
  const pageName = name.slice(0, idx);
  const vpName = name.slice(idx + 1);
  const role = roleMap[pageName] ?? "public";

  evidence.push({
    page: `/${pageName.replace(/-/g, "/")}`,
    viewport: vpName,
    role,
    screenshotPath: `screenshots-phase16/${file}`,
  });
}

writeFileSync(join(DIR, "_audit-evidence.json"), JSON.stringify(evidence, null, 2));
console.log(`Built ${evidence.length} evidence entries.`);
