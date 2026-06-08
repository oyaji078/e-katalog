# Phase Admin Retail Analytics Report Geo Hero Favicon Fix Report

Tanggal: 2026-06-08

## Scope

Phase ini memperbaiki area admin produk, retail user/token, dashboard analytics, laporan, registrasi retail, running text, hero banner, favicon publik, dan tinggi hero homepage.

Guardrail yang dijaga:

- Tidak menambahkan cart, checkout, payment, shipping, atau order flow.
- Tidak menjalankan `prisma migrate reset`.
- Tidak menghapus migration.
- Tidak mengekspos `costPrice`, margin internal, atau database id internal pada halaman publik.
- WhatsApp tetap menjadi CTA utama.

## Perubahan Utama

### Admin Produk

- Menambahkan search, filter, dan pagination berbasis query string di `/admin/products`.
- Filter mencakup nama/kode produk, kategori, merek, status, status stok, sorotan, range harga, dan tanggal dibuat.
- Pagination mempertahankan filter aktif.
- Product code/SKU tetap menjadi identitas publik produk. Halaman detail publik memakai `slug` atau `sku`, sementara legacy `id` hanya diarahkan ulang ke identifier publik.

### Retail User dan Token

- Menggabungkan pengelolaan user retail dan token dalam `/admin/retail-users`.
- Menambahkan tab `Pengguna Ritel`, `Perlu Token`, dan `Token Aktivasi`.
- Menghapus menu sidebar `/admin/generate-token` karena token sekarang dikelola di halaman retail users.
- Admin dapat membuat token untuk akun `REGISTERED` maupun `PENDING_RETAIL`.
- Regenerate token mencabut token aktif sebelumnya sebelum membuat token baru.
- Token mentah tidak ditulis ke audit log.

### Dashboard Admin dan Super Admin

- Menambahkan range analytics: 7 hari, 1 bulan, 3 bulan, dan custom date range.
- Dashboard admin sekarang memakai grafik tren kunjungan, klik WhatsApp, dan inquiry.
- Dashboard admin menampilkan bar chart produk paling dilihat dan paling sering dikontak.
- Dashboard super-admin menampilkan KPI aktivitas periode, risiko tinggi, dan bar chart aktivitas admin dari `AdminActivityLog`.

### Reports

- Halaman `/admin/reports` tetap memakai laporan e-katalog berbasis range tanggal: pendaftar retail, retail aktif, kontak WhatsApp, produk paling banyak dihubungi, dan kode retail.
- Export CSV tetap tersedia.
- Token pada laporan tetap dimasking.

### Registrasi Retail dan Geolocation

- Menambahkan tombol `Ambil Lokasi Saat Ini` pada form register retail.
- Geolocation hanya berjalan saat user menekan tombol.
- Karena schema hanya memiliki field `address`, koordinat disimpan ke field alamat sebagai teks.
- Menambahkan redirect kompatibel `/retail/register` ke `/register`.

### Marquee, Hero, dan Favicon

- Running text publik sekarang memakai animasi marquee yang sudah ada di CSS.
- Hero homepage dibuat lebih tinggi untuk first access dan overlay gambar diringankan.
- Admin hero banner kini membedakan `Aktif`, `Terjadwal`, `Kedaluwarsa`, dan `Tidak Aktif`.
- Hero aktif dengan tanggal akhir lampau ditolak saat create/update.
- Metadata root memakai favicon upload dari site settings, fallback ke logo upload, lalu `/favicon.ico`.

## File Utama yang Diubah

- `src/app/admin/products/page.tsx`
- `src/app/admin/products/AdminProductsPageClient.tsx`
- `src/app/admin/retail-users/page.tsx`
- `src/app/admin/retail-users/actions.ts`
- `src/app/admin/retail-users/RetailUserActionsClient.tsx`
- `src/components/layout/AdminSidebar.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/DashboardTabs.tsx`
- `src/app/super-admin/page.tsx`
- `src/lib/dashboard-range.ts`
- `src/lib/analytics.ts`
- `src/app/register/page.tsx`
- `src/app/retail/register/page.tsx`
- `src/components/layout/PublicNavbar.tsx`
- `src/components/ui/HeroBanner.tsx`
- `src/app/admin/hero-banners/page.tsx`
- `src/app/admin/hero-banners/actions.ts`
- `src/app/layout.tsx`

## Validation

- `npx prisma validate`: PASSED
- `npm run prisma:generate`: PASSED
- `npx prisma migrate status --schema prisma/schema.prisma`: PASSED
  - Database `e_katalog` di `127.0.0.1:3307`
  - 15 migrations ditemukan
  - Database schema up to date
- `npm run typecheck`: PASSED
- `npm run lint`: PASSED
- `npm run build`: PASSED

Build notes:

- Next.js production build berhasil.
- Route `/retail/register` ikut terdaftar.
- Build mengeluarkan warning existing: rate-limit memakai in-memory store karena `REDIS_URL` belum diset untuk production.

## Runtime Checks

Runtime dicek terhadap dev server repo yang sudah berjalan di `http://localhost:3000`.

Routes yang dicek pada viewport mobile `390x844` dan desktop `1440x1000`:

- `/`
- `/products`
- `/register`
- `/retail/register`
- `/login`
- `/admin`
- `/admin/products`
- `/admin/retail-users`
- `/super-admin`

Hasil:

- Semua route merespons tanpa error browser.
- Tidak ada horizontal overflow pada viewport mobile dan desktop.
- `/retail/register` redirect ke `/register`.
- Route admin dan super-admin tanpa sesi diarahkan ke login dengan callback URL, tanpa 500.
- Running text memiliki animation `public-announcement-marquee`.
- Hero homepage terukur 780px pada viewport desktop 1000px.

## Risiko dan Catatan

- Geolocation belum melakukan reverse geocoding karena tidak ada provider geocoding di repo. Koordinat disimpan langsung pada `address`.
- Visual authenticated dashboard admin/super-admin tidak diuji dengan sesi login karena tidak ada kredensial admin di konteks runtime. Build, typecheck, lint, dan route guard sudah lulus.
- Halaman laporan sudah memadai untuk e-katalog dan CSV, tetapi chart laporan khusus bisa menjadi backlog kecil jika dibutuhkan terpisah dari dashboard analytics.

## Verdict

PASSED WITH MINOR BACKLOG
