/**
 * Demo Seed Script — Phase 16 Client Demo Finalization
 *
 * Creates local demo users and updates demo data for client presentation.
 * This script runs only in development/local environments.
 *
 * WARNING: This script creates users with known passwords for demo purposes.
 * Do NOT run on production databases.
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword as betterHashPassword } from "@better-auth/utils/password";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_PASSWORD = "Demo1234!";

const demoUsers = [
  {
    name: "Admin Demo",
    email: "admin@demo.ekatalog",
    password: DEMO_PASSWORD,
    role: "ADMIN" as const,
    retailStatus: "RETAIL_ACTIVE" as const,
    whatsappNumber: "6281111111111",
    storeName: "Demo Store Admin",
    userCode: "DEMO-ADMIN",
  },
  {
    name: "Super Admin Demo",
    email: "superadmin@demo.ekatalog",
    password: DEMO_PASSWORD,
    role: "SUPER_ADMIN" as const,
    retailStatus: "RETAIL_ACTIVE" as const,
    whatsappNumber: "6282222222222",
    storeName: "Demo Store Super Admin",
    userCode: "DEMO-SUPERADMIN",
  },
  {
    name: "Retail Aktif Demo",
    email: "retail@demo.ekatalog",
    password: DEMO_PASSWORD,
    role: "USER" as const,
    retailStatus: "RETAIL_ACTIVE" as const,
    whatsappNumber: "6283333333333",
    storeName: "Demo Store Retail",
    userCode: "DEMO-RETAIL",
  },
  {
    name: "Retail Pending Demo",
    email: "pending@demo.ekatalog",
    password: DEMO_PASSWORD,
    role: "USER" as const,
    retailStatus: "PENDING_RETAIL" as const,
    whatsappNumber: "6284444444444",
    storeName: "Demo Store Pending",
    userCode: "DEMO-PENDING",
  },
  {
    name: "User Biasa Demo",
    email: "user@demo.ekatalog",
    password: DEMO_PASSWORD,
    role: "USER" as const,
    retailStatus: "REGISTERED" as const,
    whatsappNumber: "6285555555555",
    userCode: "DEMO-USER",
  },
];

const demoCategories = [
  {
    name: "Laptop",
    slug: "laptop",
    description: "Laptop gaming, kerja, dan multimedia dengan pilihan terbaik.",
    icon: "laptop",
    sortOrder: 10,
  },
  {
    name: "Aksesoris",
    slug: "aksesoris",
    description: "Aksesoris komputer dan gadget untuk melengkapi pengalaman Anda.",
    icon: "headphones",
    sortOrder: 20,
  },
  {
    name: "Komponen PC",
    slug: "komponen-pc",
    description: "Komponen PC seperti motherboard, RAM, SSD, dan pendingin.",
    icon: "cpu",
    sortOrder: 30,
  },
  {
    name: "Monitor",
    slug: "monitor",
    description: "Monitor kualitas tinggi untuk gaming, desain, dan produktivitas.",
    icon: "monitor",
    sortOrder: 40,
  },
  {
    name: "Audio",
    slug: "audio",
    description: "Perangkat audio seperti headset, speaker, dan aksesori suara.",
    icon: "volume-2",
    sortOrder: 50,
  },
];

const demoBrands = [
  {
    name: "ASUS",
    slug: "asus",
    description: "Brand laptop dan komponen berkualitas untuk performa andal.",
    sortOrder: 10,
  },
  {
    name: "Cooler Master",
    slug: "cooler-master",
    description: "Aksesoris dan pendingin PC dengan desain profesional.",
    sortOrder: 20,
  },
  {
    name: "Kingston",
    slug: "kingston",
    description: "Solusi memori, SSD, dan penyimpanan handal untuk semua PC.",
    sortOrder: 30,
  },
  {
    name: "Logitech",
    slug: "logitech",
    description: "Perangkat periferal dan aksesori yang nyaman untuk produktivitas.",
    sortOrder: 40,
  },
  {
    name: "Razer",
    slug: "razer",
    description: "Merek gaming dengan mouse, keyboard, dan headset performa tinggi.",
    sortOrder: 50,
  },
];

type DemoProduct = {
  name: string;
  sku: string;
  slug: string;
  description: string;
  shortSpecification: string;
  categorySlug: string;
  brandSlug: string;
  costPrice: number;
  publicMarginType: "PERCENTAGE" | "FIXED_AMOUNT";
  publicMarginValue: number;
  retailMarginType: "PERCENTAGE" | "FIXED_AMOUNT";
  retailMarginValue: number;
  publicPrice: number;
  retailPrice: number;
  stockQuantity: number;
  stockStatus: "READY" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  primaryImageUrl?: string | null;
};

const demoProducts: DemoProduct[] = [
  {
    name: "ASUS VivoBook 15 X1504VA",
    sku: "ASUS-VB15-001",
    slug: "asus-vivobook-15-x1504va",
    description: "Laptop tipis dan ringan untuk produktivitas sehari-hari dengan layar 15,6 inci Full HD.",
    shortSpecification: "Intel Core i5-1335U, 8GB RAM, 512GB SSD",
    categorySlug: "laptop",
    brandSlug: "asus",
    costPrice: 8200000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 20,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 9800000,
    retailPrice: 9300000,
    stockQuantity: 15,
    stockStatus: "READY",
    status: "ACTIVE",
    primaryImageUrl: "https://via.placeholder.com/720x480?text=ASUS+VivoBook+15",
  },
  {
    name: "Cooler Master MasterAir MA410P",
    sku: "CM-MA410P-001",
    slug: "cooler-master-masterair-ma410p",
    description: "Pendingin CPU tower dengan dual chamber dan RGB untuk performa stabil.",
    shortSpecification: "4 heatpipe, RGB, kompatibel Intel & AMD",
    categorySlug: "komponen-pc",
    brandSlug: "cooler-master",
    costPrice: 450000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 25,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 595000,
    retailPrice: 565000,
    stockQuantity: 25,
    stockStatus: "READY",
    status: "ACTIVE",
    primaryImageUrl: "https://via.placeholder.com/720x480?text=Cooler+Master+MA410P",
  },
  {
    name: "Kingston FURY Beast 16GB DDR5 5200MHz",
    sku: "KNG-FURY16-5200",
    slug: "kingston-fury-beast-16gb-ddr5-5200mhz",
    description: "RAM DDR5 cepat untuk PC gaming dan workstation modern.",
    shortSpecification: "16GB (2x8GB), DDR5-5200, CL40",
    categorySlug: "komponen-pc",
    brandSlug: "kingston",
    costPrice: 1150000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 18,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 1350000,
    retailPrice: 1290000,
    stockQuantity: 40,
    stockStatus: "READY",
    status: "ACTIVE",
    primaryImageUrl: "https://via.placeholder.com/720x480?text=Kingston+FURY+Beast+16GB",
  },
  {
    name: "ASUS ROG Strix G16",
    sku: "ASUS-ROG-G16-001",
    slug: "asus-rog-strix-g16",
    description: "Laptop gaming dengan GPU RTX, layar 165Hz, dan pendinginan performa tinggi.",
    shortSpecification: "Intel Core i7-14700H, 16GB RAM, 1TB SSD, RTX 4060",
    categorySlug: "laptop",
    brandSlug: "asus",
    costPrice: 25000000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 18,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 29500000,
    retailPrice: 28300000,
    stockQuantity: 8,
    stockStatus: "READY",
    status: "ACTIVE",
    primaryImageUrl: "https://via.placeholder.com/720x480?text=ASUS+ROG+Strix+G16",
  },
  {
    name: "ASUS ZenBook 14 OLED",
    sku: "ASUS-ZB14-001",
    slug: "asus-zenbook-14-oled",
    description: "Ultrabook elegan dengan layar OLED, ringan, dan baterai tahan lama.",
    shortSpecification: "Intel Core i7-1360P, 16GB RAM, 512GB SSD",
    categorySlug: "laptop",
    brandSlug: "asus",
    costPrice: 16500000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 18,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 19800000,
    retailPrice: 18800000,
    stockQuantity: 10,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Cooler Master CMP 250",
    sku: "CM-CMP250-001",
    slug: "cooler-master-cmp-250",
    description: "Mouse gaming ergonomis dengan kabel braided dan kontrol DPI presisi.",
    shortSpecification: "6 tombol, sensor optik 10.000 DPI, RGB",
    categorySlug: "aksesoris",
    brandSlug: "cooler-master",
    costPrice: 220000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 30,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 319000,
    retailPrice: 289000,
    stockQuantity: 28,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Kingston Canvas Select Plus 128GB",
    sku: "KNG-CS128-001",
    slug: "kingston-canvas-select-plus-128gb",
    description: "MicroSD untuk smartphone dan kamera dengan kecepatan write yang cepat.",
    shortSpecification: "128GB, A1, UHS-I",
    categorySlug: "aksesoris",
    brandSlug: "kingston",
    costPrice: 125000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 32,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 184000,
    retailPrice: 169000,
    stockQuantity: 60,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "ASUS TUF Gaming F15",
    sku: "ASUS-TUF-F15-001",
    slug: "asus-tuf-gaming-f15",
    description: "Laptop gaming tangguh dengan performa stabil untuk game AAA.",
    shortSpecification: "Intel Core i5-12500H, 16GB RAM, 512GB SSD, RTX 3050",
    categorySlug: "laptop",
    brandSlug: "asus",
    costPrice: 15400000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 20,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 18500000,
    retailPrice: 17500000,
    stockQuantity: 6,
    stockStatus: "LOW_STOCK",
    status: "ACTIVE",
  },
  {
    name: "Cooler Master MM711",
    sku: "CM-MM711-001",
    slug: "cooler-master-mm711",
    description: "Mouse gaming ringan dengan bodi ultra-light dan sensor presisi tinggi.",
    shortSpecification: "6200 DPI, 53g, RGB",
    categorySlug: "aksesoris",
    brandSlug: "cooler-master",
    costPrice: 290000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 30,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 420000,
    retailPrice: 379000,
    stockQuantity: 35,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Kingston A2000 500GB NVMe SSD",
    sku: "KNG-A2000-500",
    slug: "kingston-a2000-500gb-nvme-ssd",
    description: "SSD NVMe cepat untuk boot dan aplikasi intensif.",
    shortSpecification: "500GB, NVMe PCIe, 3500MB/s read",
    categorySlug: "komponen-pc",
    brandSlug: "kingston",
    costPrice: 780000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 22,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 980000,
    retailPrice: 930000,
    stockQuantity: 50,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "ASUS TUF Gaming A15",
    sku: "ASUS-TUF-A15-001",
    slug: "asus-tuf-gaming-a15",
    description: "Laptop gaming dengan daya tahan dan performa seimbang untuk kerja dan game.",
    shortSpecification: "AMD Ryzen 7 6800H, 16GB RAM, 512GB SSD, RTX 3060",
    categorySlug: "laptop",
    brandSlug: "asus",
    costPrice: 19800000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 18,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 22800000,
    retailPrice: 21800000,
    stockQuantity: 12,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Cooler Master MB311L",
    sku: "CM-MB311L-001",
    slug: "cooler-master-mb311l",
    description: "Case PC mid tower dengan panel samping tempered glass dan pendinginan optimal.",
    shortSpecification: "Mid Tower ATX, 2 panel tempered glass, 4 fan pre-installed",
    categorySlug: "komponen-pc",
    brandSlug: "cooler-master",
    costPrice: 845000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 28,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 1090000,
    retailPrice: 1040000,
    stockQuantity: 22,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Kingston FURY Renegade 32GB DDR5",
    sku: "KNG-FURY32-6000",
    slug: "kingston-fury-renegade-32gb-ddr5-6000mhz",
    description: "Memory DDR5 kapasitas besar untuk performa CPU dan multitasking maksimal.",
    shortSpecification: "32GB (2x16GB), DDR5-6000, CL36",
    categorySlug: "komponen-pc",
    brandSlug: "kingston",
    costPrice: 2650000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 18,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 3200000,
    retailPrice: 3080000,
    stockQuantity: 18,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "ASUS VivoBook Flip 14",
    sku: "ASUS-VF14-001",
    slug: "asus-vivobook-flip-14",
    description: "Convertible 2-in-1 dengan layar sentuh dan engsel 360 derajat.",
    shortSpecification: "Intel Core i3-1215U, 8GB RAM, 256GB SSD",
    categorySlug: "laptop",
    brandSlug: "asus",
    costPrice: 8500000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 18,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 10500000,
    retailPrice: 9990000,
    stockQuantity: 20,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Cooler Master CK552 Keyboard",
    sku: "CM-CK552-001",
    slug: "cooler-master-ck552-keyboard",
    description: "Keyboard mekanik gaming dengan switch biru dan lampu RGB.",
    shortSpecification: "Switch Blue, RGB, full-size",
    categorySlug: "aksesoris",
    brandSlug: "cooler-master",
    costPrice: 495000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 30,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 699000,
    retailPrice: 649000,
    stockQuantity: 44,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Kingston HyperX Cloud Stinger",
    sku: "KNG-HXCS-001",
    slug: "kingston-hyperx-cloud-stinger",
    description: "Headset gaming ringan dengan suara jelas dan bantalan nyaman.",
    shortSpecification: "Surround, 50mm driver, noise cancelling mic",
    categorySlug: "aksesoris",
    brandSlug: "kingston",
    costPrice: 425000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 25,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 569000,
    retailPrice: 529000,
    stockQuantity: 55,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "ASUS VivoBook 14 OLED",
    sku: "ASUS-VB14O-001",
    slug: "asus-vivobook-14-oled",
    description: "Laptop multimedia dengan layar OLED untuk warna tajam dan kontras tinggi.",
    shortSpecification: "Intel Core i5-1240P, 16GB RAM, 512GB SSD",
    categorySlug: "laptop",
    brandSlug: "asus",
    costPrice: 14500000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 18,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 17500000,
    retailPrice: 16800000,
    stockQuantity: 12,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Cooler Master MB520 ARGB",
    sku: "CM-MB520-001",
    slug: "cooler-master-mb520-argb",
    description: "Case PC mid tower dengan tampilan ARGB dinamis dan manajemen kabel rapi.",
    shortSpecification: "ARGB, tempered glass, 4 fan included",
    categorySlug: "komponen-pc",
    brandSlug: "cooler-master",
    costPrice: 980000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 27,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 1240000,
    retailPrice: 1180000,
    stockQuantity: 30,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Kingston DataTraveler 64GB",
    sku: "KNG-DT64-001",
    slug: "kingston-datatraveler-64gb",
    description: "Flash drive USB untuk penyimpanan cepat dan mudah dibawa.",
    shortSpecification: "64GB, USB-A 3.2",
    categorySlug: "aksesoris",
    brandSlug: "kingston",
    costPrice: 75000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 33,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 112000,
    retailPrice: 104000,
    stockQuantity: 80,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "ASUS VivoBook 13 Slate OLED",
    sku: "ASUS-VB13S-001",
    slug: "asus-vivobook-13-slate-oled",
    description: "Tablet convertible dengan layar OLED dan desain portabel.",
    shortSpecification: "Intel Core i3, 8GB RAM, 128GB SSD",
    categorySlug: "laptop",
    brandSlug: "asus",
    costPrice: 10500000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 20,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 13000000,
    retailPrice: 12300000,
    stockQuantity: 14,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Cooler Master MasterPulse MH320",
    sku: "CM-MH320-001",
    slug: "cooler-master-masterpulse-mh320",
    description: "Headset gaming dengan bantalan nyaman dan mikrofon noise cancelling.",
    shortSpecification: "RGB, 40mm driver, 3.5mm jack",
    categorySlug: "aksesoris",
    brandSlug: "cooler-master",
    costPrice: 235000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 32,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 349000,
    retailPrice: 329000,
    stockQuantity: 42,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Kingston HyperX Alloy Core",
    sku: "KNG-HXAC-001",
    slug: "kingston-hyperx-alloy-core",
    description: "Keyboard gaming membrane dengan lampu RGB dan tuts anti-ghosting.",
    shortSpecification: "Membrane, RGB, full-size",
    categorySlug: "aksesoris",
    brandSlug: "kingston",
    costPrice: 300000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 30,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 429000,
    retailPrice: 399000,
    stockQuantity: 65,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "ASUS ROG Flow X13",
    sku: "ASUS-ROG-X13-001",
    slug: "asus-rog-flow-x13",
    description: "Laptop gaming convertible premium dengan GPU eksternal untuk performa tinggi.",
    shortSpecification: "AMD Ryzen 9, 16GB RAM, 1TB SSD, GTX 1650",
    categorySlug: "laptop",
    brandSlug: "asus",
    costPrice: 31500000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 18,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 36900000,
    retailPrice: 35500000,
    stockQuantity: 5,
    stockStatus: "LOW_STOCK",
    status: "ACTIVE",
  },
  {
    name: "Cooler Master MasterLiquid ML240L",
    sku: "CM-ML240L-001",
    slug: "cooler-master-masterliquid-ml240l",
    description: "Liquid cooler AIO 240mm dengan kipas ARGB untuk pendinginan CPU yang sunyi.",
    shortSpecification: "240mm radiator, ARGB, dual fan",
    categorySlug: "komponen-pc",
    brandSlug: "cooler-master",
    costPrice: 1130000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 25,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 1490000,
    retailPrice: 1420000,
    stockQuantity: 16,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Kingston FURY Impact 16GB DDR4",
    sku: "KNG-FURY16DDR4-001",
    slug: "kingston-fury-impact-16gb-ddr4-3200mhz",
    description: "RAM DDR4 untuk laptop dan PC kecil dengan performa stabil.",
    shortSpecification: "16GB (2x8GB), DDR4-3200, CL20",
    categorySlug: "komponen-pc",
    brandSlug: "kingston",
    costPrice: 860000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 20,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 1090000,
    retailPrice: 1040000,
    stockQuantity: 34,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "ASUS ExpertBook B3",
    sku: "ASUS-EXB3-001",
    slug: "asus-expertbook-b3",
    description: "Laptop bisnis ringkas dengan konektivitas lengkap dan keamanan built-in.",
    shortSpecification: "Intel Core i5, 8GB RAM, 256GB SSD",
    categorySlug: "laptop",
    brandSlug: "asus",
    costPrice: 11200000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 18,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 13300000,
    retailPrice: 12600000,
    stockQuantity: 24,
    stockStatus: "READY",
    status: "ACTIVE",
    primaryImageUrl: null,
  },
  {
    name: "Cooler Master MasterBox MB520",
    sku: "CM-MB520-002",
    slug: "cooler-master-masterbox-mb520",
    description: "Case PC with mesh front panel and three ARGB fans.",
    shortSpecification: "Mesh front, ARGB, 3 fans included",
    categorySlug: "komponen-pc",
    brandSlug: "cooler-master",
    costPrice: 990000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 28,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 1280000,
    retailPrice: 1220000,
    stockQuantity: 18,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Kingston FURY Renegade SSD 1TB",
    sku: "KNG-FURY1TB-001",
    slug: "kingston-fury-renegade-ssd-1tb",
    description: "SSD NVMe kapasitas besar dengan kecepatan baca dan tulis tinggi.",
    shortSpecification: "1TB, NVMe PCIe, 7300MB/s read",
    categorySlug: "komponen-pc",
    brandSlug: "kingston",
    costPrice: 1680000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 18,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 2050000,
    retailPrice: 1950000,
    stockQuantity: 12,
    stockStatus: "READY",
    status: "ACTIVE",
    primaryImageUrl: null,
  },
  {
    name: "ASUS Chromebook CX1",
    sku: "ASUS-CX1-001",
    slug: "asus-chromebook-cx1",
    description: "Chromebook terjangkau dengan portabilitas tinggi dan pengalaman Chrome OS.",
    shortSpecification: "Intel Celeron, 4GB RAM, 64GB eMMC",
    categorySlug: "laptop",
    brandSlug: "asus",
    costPrice: 5200000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 22,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 6690000,
    retailPrice: 6290000,
    stockQuantity: 40,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Cooler Master Hydro Series H212",
    sku: "CM-H212-001",
    slug: "cooler-master-hydro-series-h212",
    description: "Tower cooler CPU dengan desain simpel dan aliran udara optimal.",
    shortSpecification: "3 fan support, dual tower, universal socket",
    categorySlug: "komponen-pc",
    brandSlug: "cooler-master",
    costPrice: 375000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 28,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 499000,
    retailPrice: 469000,
    stockQuantity: 38,
    stockStatus: "READY",
    status: "ACTIVE",
  },
  {
    name: "Kingston HyperX Cloud Alpha",
    sku: "KNG-HXCA-001",
    slug: "kingston-hyperx-cloud-alpha",
    description: "Headset gaming premium dengan dual chamber driver untuk suara detail.",
    shortSpecification: "Dual chamber, 50mm driver, mic noise canceling",
    categorySlug: "aksesoris",
    brandSlug: "kingston",
    costPrice: 650000,
    publicMarginType: "PERCENTAGE",
    publicMarginValue: 24,
    retailMarginType: "PERCENTAGE",
    retailMarginValue: 10,
    publicPrice: 859000,
    retailPrice: 819000,
    stockQuantity: 20,
    stockStatus: "READY",
    status: "ACTIVE",
    primaryImageUrl: null,
  },
];

async function hashDemoPassword(password: string): Promise<string> {
  return betterHashPassword(password);
}

async function upsertDemoCatalog(prisma: PrismaClient) {
  const categoryIds = new Map<string, string>();
  for (const category of demoCategories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
    categoryIds.set(category.slug, record.id);
  }

  const brandIds = new Map<string, string>();
  for (const brand of demoBrands) {
    const record = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
        description: brand.description,
        sortOrder: brand.sortOrder,
        isActive: true,
      },
      create: {
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        sortOrder: brand.sortOrder,
        isActive: true,
      },
    });
    brandIds.set(brand.slug, record.id);
  }

  for (const product of demoProducts) {
    const categoryId = categoryIds.get(product.categorySlug);
    const brandId = brandIds.get(product.brandSlug);
    if (!categoryId || !brandId) {
      throw new Error(`Missing category or brand for product ${product.sku}`);
    }

    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortSpecification: product.shortSpecification,
        costPrice: product.costPrice,
        publicMarginType: product.publicMarginType,
        publicMarginValue: product.publicMarginValue,
        retailMarginType: product.retailMarginType,
        retailMarginValue: product.retailMarginValue,
        publicPrice: product.publicPrice,
        retailPrice: product.retailPrice,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        status: product.status,
        primaryImageUrl: product.primaryImageUrl,
        categoryId,
        brandId,
      },
      create: {
        name: product.name,
        sku: product.sku,
        slug: product.slug,
        description: product.description,
        shortSpecification: product.shortSpecification,
        costPrice: product.costPrice,
        publicMarginType: product.publicMarginType,
        publicMarginValue: product.publicMarginValue,
        retailMarginType: product.retailMarginType,
        retailMarginValue: product.retailMarginValue,
        publicPrice: product.publicPrice,
        retailPrice: product.retailPrice,
        stockQuantity: product.stockQuantity,
        stockStatus: product.stockStatus,
        status: product.status,
        primaryImageUrl: product.primaryImageUrl,
        categoryId,
        brandId,
      },
    });
  }
}

const voucherUpdates = [
  {
    code: "TES-VC-001",
    title: "Promo Pelajar & Mahasiswa",
    description: "Nikmati diskon spesial aksesoris dan laptop untuk pelajar dan mahasiswa.",
    minimumPurchase: 100000,
  },
  {
    code: "P141-QUOTA1",
    title: "Voucher Diskon Produk Pilihan",
    description: "Voucher diskon untuk produk-produk pilihan. Klaim sekarang sebelum habis!",
    minimumPurchase: 250000,
  },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL!;
  const adapter = new PrismaMariaDb(databaseUrl, { useTextProtocol: true });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("=== Creating demo users ===");

    for (const user of demoUsers) {
      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      if (existing) {
        console.log(`  User already exists: ${user.email} — updating role/status`);
        await prisma.user.update({
          where: { email: user.email },
          data: {
            role: user.role,
            retailStatus: user.retailStatus,
            name: user.name,
            whatsappNumber: user.whatsappNumber,
            storeName: user.storeName,
          },
        });
        continue;
      }

      const userId = randomUUID();
      const hashed = await hashDemoPassword(user.password);

      await prisma.user.create({
        data: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
          retailStatus: user.retailStatus,
          whatsappNumber: user.whatsappNumber,
          storeName: user.storeName,
          userCode: user.userCode,
          emailVerified: true,
        },
      });

      await prisma.account.create({
        data: {
          id: randomUUID(),
          userId,
          accountId: user.email,
          providerId: "credential",
          password: hashed,
        },
      });

      console.log(`  Created: ${user.email} (${user.role}, ${user.retailStatus})`);
    }

    console.log("\n=== Upserting demo catalog ===");
    await upsertDemoCatalog(prisma);

    console.log("\n=== Updating voucher demo data ===");

    for (const update of voucherUpdates) {
      const voucher = await prisma.voucher.findUnique({ where: { code: update.code } });
      if (!voucher) {
        console.log(`  Voucher not found: ${update.code} — skipping`);
        continue;
      }
      await prisma.voucher.update({
        where: { code: update.code },
        data: {
          title: update.title,
          description: update.description,
          minimumPurchase: update.minimumPurchase,
        },
      });
      console.log(`  Updated: ${update.code} → "${update.title}" (min Rp ${update.minimumPurchase.toLocaleString("id-ID")})`);
    }

    console.log("\n=== Demo seed complete ===");
    console.log("\nDemo credentials (for local dev only):");
    console.log("  Admin:          admin@demo.ekatalog / Demo1234!");
    console.log("  Super Admin:    superadmin@demo.ekatalog / Demo1234!");
    console.log("  Retail Active:  retail@demo.ekatalog / Demo1234!");
    console.log("  Retail Pending: pending@demo.ekatalog / Demo1234!");
    console.log("  Regular User:   user@demo.ekatalog / Demo1234!");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
