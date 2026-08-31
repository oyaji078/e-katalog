# Deploy ke Hostinger Business — ramacomputer.id

Panduan ini khusus untuk stack repo ini: **Next.js 16 (server, bukan static export) + Prisma 7 + MySQL + better-auth**, di **Hostinger Business Web Hosting**.

> **Kenapa Business, bukan Premium/Single?**
> App ini butuh proses Node.js yang berjalan terus (`next start`). Hostinger baru menambahkan dukungan Node.js ke shared hosting pada Desember 2025, dan hanya untuk paket **Business** (maks. 5 app) serta **Cloud Startup ke atas** (maks. 10 app). Premium dan Single tetap PHP-only.

---

## 0. Prasyarat

| Item | Nilai |
|---|---|
| Paket hosting | Business Web Hosting |
| Domain | `ramacomputer.id` |
| Node.js | 24.x (lihat `engines` di `package.json`) |
| Repo | `https://github.com/oyaji078/e-katalog` |
| Branch produksi | `main` |

**Status branch:** `wip/phase27-recovery`, `main`, dan `origin/main` semuanya menunjuk commit yang sama (`5adc8a5`) — tidak ada yang perlu di-merge. Perubahan penyiapan deploy tinggal di-commit lalu di-push ke `main`.

---

## Catatan: perubahan kode yang sudah diterapkan

Saat menyiapkan deploy ini, build produksi **gagal** dengan:

```
Error occurred prerendering page "/categories"
DriverAdapterError: pool timeout ... connect ECONNREFUSED 127.0.0.1:3307
```

**Penyebabnya bukan halaman itu sendiri, melainkan root layout.** `src/app/layout.tsx` membaca database pada setiap render:

- `generateMetadata()` memanggil `getPublicSiteSettings()`
- `RootLayout` memanggil `isFeatureEnabled()` (tiga kali), `getPublicSiteSettings()`, dan `getCurrentUser()`

Root layout membungkus **setiap** halaman, jadi setiap halaman yang coba di-prerender ikut menembak database. Ini juga menjelaskan kenapa saat halaman pertama diperbaiki, error-nya cuma pindah ke halaman lain (`/categories` → `/retail/register`) — bahkan halaman yang isinya hanya `redirect("/register")` pun gagal.

Normalnya Next otomatis menandai rute sebagai dinamis begitu ada yang membaca `headers()`. Di sini sinyal itu tertelan dua kali:

- `RootLayout` membungkus `await import("next/headers")` dan `headers()` dalam `try { ... } catch {}`
- `getCurrentUser()` punya `try/catch` di dalamnya **dan** dipanggil dengan `.catch(() => null)`

Akibatnya Next tidak pernah melihat sinyal tersebut dan tetap menganggap rute bisa distatiskan.

**Perbaikan yang diterapkan:** satu baris di `src/app/layout.tsx`:

```ts
export const dynamic = "force-dynamic";
```

Route segment config pada sebuah layout berlaku untuk seluruh segmen di bawahnya, jadi satu baris di root layout menutup seluruh aplikasi — tidak perlu menambahkannya per halaman. (Halaman `/admin/*` tetap punya penanda `force-dynamic` masing-masing; itu sudah ada sebelumnya dan tidak diubah.)

Dua akibat baiknya:

1. **Build tidak lagi butuh database.** Ini penting karena build Hostinger bisa saja berjalan di kontainer terpisah yang tidak bisa menjangkau MySQL Anda di `localhost`. Tanpa perbaikan ini, deploy berisiko gagal di server dengan error yang sama.
2. **Katalog selalu menampilkan data terkini.** Kalau halaman-halaman itu dibiarkan statis, produk baru yang ditambahkan admin tidak akan muncul di situs publik sampai ada redeploy — bug yang serius untuk aplikasi katalog.

### Kegagalan kedua: `prisma generate` menuntut DATABASE_URL

Deploy pertama di Hostinger tetap gagal, dengan sebab yang berbeda:

```
PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL.
ERROR: Failed to build the application
```

`prisma.config.ts` memakai helper `env("DATABASE_URL")` dari `prisma/config`, dan helper itu **melempar error kalau variabelnya tidak terdefinisi**. Di server build tidak ada `.env` (memang sengaja tidak diikutkan) dan variabel itu belum di-set, jadi `prisma generate` mati sebelum `next build` sempat jalan.

Yang penting dipahami: `prisma generate` **tidak pernah membuka koneksi database** — ia hanya membaca `schema.prisma` untuk membuat client. Jadi menuntut `DATABASE_URL` di situ memang tidak perlu.

**Perbaikan:** `prisma.config.ts` sekarang hanya meneruskan `datasource` ketika variabelnya benar-benar ada:

```ts
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
```

Perilaku yang sudah diverifikasi setelah perubahan:

| Perintah | Tanpa `DATABASE_URL` | Dengan `DATABASE_URL` |
|---|---|---|
| `prisma generate` | berhasil | berhasil |
| `prisma migrate deploy` / `status` | gagal tegas: *"The datasource.url property is required"* | menyasar host yang benar |

Jadi build tidak lagi bisa dijatuhkan oleh variabel yang hilang, tapi perintah migrasi tetap menolak berjalan tanpa target yang jelas — tidak ada risiko diam-diam menulis ke database yang salah.

### Versi Node di Hostinger

Log deploy menunjukkan build berjalan di **Node v20.19.4**, padahal `package.json` menuntut `">=24 <25"`. Ini muncul sebagai peringatan `EBADENGINE`, **bukan** penyebab kegagalan — `npm install` tetap berhasil memasang 548 paket. Tetap saja, setel versi Node ke **24.x** di hPanel agar sama dengan target pengembangan.

---

**Konsekuensinya:** setiap request ke halaman publik menembak database, tidak ada cache statis. Di paket shared yang CPU-nya terbatas ini perlu diperhatikan kalau trafik naik. Kalau nanti terasa berat, langkah lanjutannya adalah memperbaiki `getCurrentUser()` agar tidak menelan sinyal dinamis, lalu memakai cache per-komponen untuk bagian katalog yang tidak bergantung sesi — bukan sekadar mengembalikan halaman jadi statis.

---

## 1. Buat database MySQL

hPanel → **Databases** → **Management** → *Create new database*.

Hostinger otomatis memberi prefix pada nama database dan user (misal `u123456789_ekatalog`). Catat empat hal ini:

- nama database
- username
- password
- host (`localhost` selama app dan database ada di akun hosting yang sama)

Susun jadi `DATABASE_URL`:

```
mysql://USER:PASSWORD@localhost:3306/DBNAME
```

> **Awas password:** karakter yang punya makna khusus di URI harus di-encode — `@` jadi `%40`, `:` jadi `%3A`, `/` jadi `%2F`, `#` jadi `%23`, `?` jadi `%3F`. Password dengan `@` mentah akan membuat koneksi gagal dengan error yang menyesatkan.

**Kalau koneksi ditolak dengan error soal RSA public key**, tambahkan parameter yang sama seperti yang dipakai `.env` lokal repo ini:

```
mysql://USER:PASSWORD@localhost:3306/DBNAME?allowPublicKeyRetrieval=true&connection_limit=10&pool_timeout=30
```

MySQL 8 memakai `caching_sha2_password`; tanpa `allowPublicKeyRetrieval=true`, koneksi non-TLS bisa ditolak. `connection_limit` juga layak dibatasi di shared hosting, karena kuota koneksi MySQL di paket bersama jauh lebih kecil daripada di server sendiri.

---

## 2. Jalankan migrasi database

Ada 15 migrasi di `prisma/migrations/`. Database baru masih kosong, jadi migrasi wajib dijalankan sebelum app dinyalakan.

Karena hosting terkelola tidak selalu memberi shell ke direktori app, cara paling terkontrol adalah menjalankan migrasi **dari komputer lokal** ke database Hostinger:

1. hPanel → **Databases** → **Remote MySQL** → tambahkan IP publik Anda ke daftar izin.
   Hindari `%` atau *any host* — itu membuka database ke seluruh internet.
2. Di lokal, buat file `.env.migrate` berisi `DATABASE_URL` yang menunjuk ke **host remote** Hostinger (bukan `localhost`, karena Anda konek dari luar):

   ```
   DATABASE_URL="mysql://USER:PASSWORD@REMOTE_HOST:3306/DBNAME"
   ```

3. Jalankan migrasi dengan menunjuk dotenv ke berkas itu:

   ```powershell
   # PowerShell
   $env:DOTENV_CONFIG_PATH = ".env.migrate"; npx prisma migrate deploy
   ```

   ```bash
   # Git Bash / WSL
   DOTENV_CONFIG_PATH=.env.migrate npx prisma migrate deploy
   ```

4. Setelah selesai, **hapus lagi IP dari Remote MySQL** dan hapus `.env.migrate`.

**Kenapa `DOTENV_CONFIG_PATH`, bukan `npx dotenv -e`?** Repo ini memasang paket `dotenv` (pustaka), bukan `dotenv-cli` — tidak ada binary `dotenv`, jadi `npx dotenv -e ...` akan gagal. Yang berhasil adalah `DOTENV_CONFIG_PATH`, karena `prisma.config.ts` dan `prisma/seed.ts` sama-sama memakai `import "dotenv/config"`, dan preloader itu menghormati variabel tersebut. Keuntungan lain: password tetap di dalam berkas, tidak ikut tercatat di riwayat shell.

> Perhatikan juga: `dotenv` **tidak menimpa** variabel yang sudah ada di environment. Kalau `DATABASE_URL` kebetulan sudah ter-set di shell Anda, nilai itulah yang dipakai, bukan isi `.env.migrate`. Perintah di atas selalu mencetak host tujuan sebelum berjalan — pastikan yang tampil host Hostinger, bukan `127.0.0.1`.

> `migrate deploy` hanya menerapkan migrasi yang sudah ada — tidak pernah membuat migrasi baru dan tidak pernah menghapus data. Ini perintah yang benar untuk produksi. Jangan pakai `prisma migrate dev` di database produksi.

---

## 3. Isi data awal (seed)

Setelah migrasi berhasil, isi feature flag dan store setting default:

> **Perhatikan:** `prisma/seed.ts` **tidak membuat akun admin.** Isinya hanya `featureFlag.upsert` dan `storeSetting.upsert` — 13 feature flag dan 4 store setting. Untuk mendapatkan admin pertama, daftar lewat `/register` di situs, lalu naikkan perannya langsung di database:
>
> ```sql
> UPDATE `user` SET role = 'SUPER_ADMIN' WHERE email = 'email-anda@contoh.com';
> ```
>
> Cara ini memakai mekanisme hashing password milik better-auth sendiri, jadi tidak ada risiko hash yang tidak cocok — berbeda kalau baris user dibuat manual lewat SQL.


```powershell
# PowerShell
$env:DOTENV_CONFIG_PATH = ".env.migrate"; npm run prisma:seed
```

```bash
# Git Bash / WSL
DOTENV_CONFIG_PATH=.env.migrate npm run prisma:seed
```

Cek `prisma/seed.ts` untuk melihat kredensial admin yang dibuat, lalu **ganti passwordnya lewat UI** setelah login pertama.

---

## 4. Buat Node.js website di hPanel

hPanel → **Websites** → *Add Website* → pilih tipe **Node.js**.

> Catatan dari dokumentasi Hostinger: aplikasi Node.js saat ini harus dibuat sebagai **website baru** — tidak bisa dikonversi dari website PHP yang sudah ada.

Pengaturan yang dipakai:

| Field | Nilai |
|---|---|
| Deployment method | **GitHub** (agar tiap push ke `main` otomatis redeploy) |
| Repository | `oyaji078/e-katalog` |
| Branch | `main` |
| Framework | **Next.js** (biasanya terdeteksi otomatis) |
| Node.js version | **24.x** |
| Output directory | `.next` |
| Entry file | *kosongkan* — hanya perlu kalau framework di-set "Other" |

Build dan start memakai script dari `package.json`:

- build → `npm run build` (`prisma generate && next build`)
- start → `npm run start` (`next start`)

`next start` membaca variabel `PORT` yang di-inject Hostinger, jadi tidak ada yang perlu diubah di kode.

---

## 5. Set environment variables

hPanel → website → **Node.js** → *Environment variables*.

Isi persis seperti berikut (template lengkap dengan penjelasan ada di [.env.production.example](.env.production.example)):

| Key | Value |
|---|---|
| `DATABASE_URL` | `mysql://USER:PASSWORD@localhost:3306/DBNAME` |
| `BETTER_AUTH_SECRET` | 32 byte acak — **buat baru, jangan pakai punya dev** |
| `BETTER_AUTH_URL` | `https://ramacomputer.id` |
| `NEXT_PUBLIC_APP_URL` | `https://ramacomputer.id` |
| `STORE_WHATSAPP_NUMBER` | `6287750008403` |
| `RATE_LIMIT_DISABLED` | `false` |

Buat secret baru dengan:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### Dua jebakan yang paling sering bikin gagal

1. **Set semua variabel SEBELUM build pertama.** Next.js menanam nilai `NEXT_PUBLIC_*` ke dalam bundle saat build. Mengubahnya nanti butuh **redeploy penuh**, bukan sekadar restart.

2. **`BETTER_AUTH_URL` dan `NEXT_PUBLIC_APP_URL` harus identik**, pakai `https`, **tanpa garis miring di akhir.** `src/lib/auth.ts` menyusun daftar trusted origin dari kedua variabel ini; kalau tidak cocok dengan origin asli, better-auth menolak setiap login dengan 403 — dan pesan errornya tidak menyebut penyebabnya.

---

## 6. Pasang domain dan SSL

**Kabar baik: DNS sudah beres.** `ramacomputer.id` sudah ada di akun Hostinger Anda (aktif, berlaku sampai 9 Agustus 2027) dan zona DNS-nya sudah mengarah ke infrastruktur Hostinger:

| Record | Tipe | Nilai |
|---|---|---|
| `@` | ALIAS | `ramacomputer.id.cdn.hstgr.net.` |
| `www` | CNAME | `www.ramacomputer.id.cdn.hstgr.net.` |
| `ftp` | A | `153.92.10.62` |

Jadi tidak perlu mengubah nameserver atau menambah A record, dan tidak ada masa tunggu propagasi.

Yang tersisa:

1. hPanel → website → **Domains** → pastikan `ramacomputer.id` di-assign ke website Node.js yang baru dibuat, bukan ke website lama.
2. hPanel → **Security** → **SSL** → terbitkan sertifikat gratis untuk `ramacomputer.id`.
3. Aktifkan **Force HTTPS**.

Kerjakan langkah ini **sebelum** build pertama, supaya `https://ramacomputer.id` sudah benar-benar hidup saat nilai env ditanam ke bundle.

---

## 7. Verifikasi setelah deploy

Urutkan dari yang paling murah:

- [ ] `https://ramacomputer.id` membuka halaman katalog
- [ ] Response header memuat `Content-Security-Policy` dan `X-Frame-Options` (dari `next.config.ts`)
- [ ] Gambar produk tampil
- [ ] Registrasi user baru berhasil
- [ ] Login berhasil — **ini yang membuktikan `BETTER_AUTH_URL` benar**
- [ ] Login admin dan buka `/admin`
- [ ] Halaman system health di admin: database `OK`, Redis `WARN` (wajar, lihat di bawah)
- [ ] Upload satu gambar produk dari admin, pastikan muncul di katalog
- [ ] Tombol WhatsApp membuka nomor yang benar

---

## 8. Masalah yang sudah diketahui

### 8.1 Gambar produk hilang setiap redeploy — perlu ditangani

`public/uploads/products/*` masuk `.gitignore`, jadi gambar yang di-upload admin **tidak ada di repo**. Kalau Hostinger membersihkan direktori app saat deploy ulang dari GitHub (perilaku umum untuk deploy berbasis git), semua gambar produk akan hilang tiap kali ada push ke `main`.

Promo banner tidak kena masalah ini — 4 file-nya memang di-commit ke repo.

**Verifikasi dulu sebelum menganggap ini pasti terjadi:** upload satu gambar produk lewat admin, lalu picu satu redeploy, lalu cek apakah gambarnya masih ada. Hasilnya menentukan langkah berikutnya.

Kalau ternyata terhapus, tiga opsi:

| Opsi | Cara | Konsekuensi |
|---|---|---|
| **Object storage** (paling benar) | Ganti `src/lib/upload/storage.ts` agar menulis ke S3-compatible storage | Butuh perubahan kode dan biaya storage; aman permanen |
| **Simpan di luar direktori app** | Tulis ke path di luar root deploy, sajikan lewat route handler | Butuh akses SSH untuk menyiapkan direktori |
| **Commit gambar ke repo** | Hapus baris `public/uploads/products/*` dari `.gitignore` | Paling cepat, tapi repo membengkak dan admin harus commit tiap upload — tidak praktis jangka panjang |

Ini keputusan Anda; belum ada perubahan kode terkait ini.

### 8.2 Redis tidak tersedia — ini normal

Shared hosting tidak menyediakan Redis. `REDIS_URL` dibiarkan kosong, dan `src/lib/ratelimit.ts` otomatis jatuh ke penyimpanan in-memory. Itu **benar** untuk satu proses Node seperti di sini. Halaman system health akan menampilkan Redis sebagai `WARN` — itu informasi, bukan kerusakan.

### 8.3 Node lokal 22, produksi 24

`package.json` menuntut `node >=24 <25`, tapi Node di mesin ini v22.16.0. Build lokal tetap jalan (npm tidak memaksa `engines` secara default), tapi selisih versi bisa menyembunyikan masalah yang baru muncul di server. Kalau mau benar-benar sama, pakai Node 24 di lokal.

### 8.4 Image optimizer dimatikan di produksi

`next.config.ts` menyetel `unoptimized: !isDev` — disengaja. Gambar sudah dikonversi ke WebP saat upload, dan mematikan optimizer menghilangkan permukaan SSRF sekaligus beban CPU per request. Ini menguntungkan di shared hosting yang CPU-nya terbatas.

---

### 8.5 Aplikasi WAJIB memakai `localhost`, bukan hostname MySQL publik

Ini menghabiskan waktu paling lama saat penyiapan, jadi catat baik-baik.

hPanel menampilkan hostname MySQL `srv1417.hstgr.io` di halaman **Remote MySQL**. Hostname itu **hanya untuk koneksi dari luar** — dari laptop Anda, misalnya. Aplikasi Node.js yang berjalan di hosting yang sama **harus memakai `localhost`**.

Kalau aplikasi memakai hostname publik, koneksinya keluar ke internet lalu masuk kembali, sehingga MySQL melihatnya datang dari IP keluar kontainer (di kasus ini `153.92.10.90`). Hak akses MySQL diberikan per-host, dan user hanya diberi izin dari `localhost` — jadi koneksinya ditolak.

**Yang membuat ini sulit dilacak:** pool `mariadb` mencoba ulang setiap kegagalan pembuatan koneksi sampai `acquireTimeout` habis, sehingga error autentikasi yang sebenarnya tertutup. Yang muncul di log hanya:

```
pool timeout: failed to retrieve a connection from pool after 20001ms
(pool connections: active=0 idle=0 limit=3)
```

Pesan itu terlihat seperti masalah jaringan atau pool, padahal sebenarnya izin. Dibuktikan dengan menguji kedua alamat dari dalam kontainer:

| Alamat | TCP | MySQL |
|---|---|---|
| `srv1417.hstgr.io:3306` | OPEN (0 ms) | **access denied** |
| `127.0.0.1:3306` | OPEN (1 ms) | **CONNECTED** |

Jadi:

- **Aplikasi di Hostinger** → `@localhost:3306`
- **Migrasi dari komputer lokal** → `@srv1417.hstgr.io:3306`, dan IP publik Anda harus terdaftar di Remote MySQL

Keduanya memakai username, password, dan nama database yang sama — hanya hostnya yang berbeda.

> Perlu diingat juga: IP publik rumahan biasanya dinamis. Daftar Remote MySQL akan basi dengan sendirinya, dan koneksi dari lokal tiba-tiba ditolak walau tidak ada yang diubah. Ini tidak memengaruhi aplikasi, karena aplikasi memakai `localhost`.

---

### 8.6 Riwayat migrasi tidak bisa membangun database dari nol — BELUM diperbaiki

Ini cacat nyata di repo, bukan masalah Hostinger, dan ditemukan saat menyiapkan database produksi.

`prisma migrate deploy` pada database kosong **selalu gagal** di migrasi kelima:

```
Migration name: 20260525000000_phase_24_reopen_fix
Database error code: 1146
Database error: Table 'FlashSale' doesn't exist
```

Sebabnya: migrasi itu menjalankan `ALTER TABLE FlashSale` dan `ALTER TABLE FlashSaleProduct`, tapi **tidak ada satu pun migrasi di `prisma/migrations/` yang membuat kedua tabel tersebut.** Dicek dengan:

```bash
grep -rl "CREATE TABLE.*FlashSale" prisma/migrations/    # tidak ada hasil
```

Kedua model itu ada di `schema.prisma`, jadi database pengembangan kemungkinan besar terbentuk lewat `prisma db push` — yang menyinkronkan skema tanpa menulis migrasi. Cacat ini tidak pernah terlihat di lokal karena database lokal tidak pernah dibangun ulang dari nol.

**Penanganan sementara di produksi:** database dibangun dengan `prisma db push` (menghasilkan 23 tabel sesuai `schema.prisma`), lalu ke-15 migrasi ditandai sebagai sudah diterapkan dengan `prisma migrate resolve --applied`. Setelah itu `prisma migrate status` melaporkan *"Database schema is up to date!"*, dan deploy berikutnya tidak akan menyentuh migrasi yang rusak itu.

**Perbaikan yang sebenarnya masih perlu dikerjakan:** tambahkan migrasi yang membuat `FlashSale` dan `FlashSaleProduct` sebelum `20260525000000_phase_24_reopen_fix`, atau susun ulang riwayat migrasi. Selama ini belum dilakukan, siapa pun yang mencoba membangun database baru dari migrasi akan menabrak error yang sama.

---

## 9. Deploy berikutnya

Setelah setup awal selesai, alurnya:

```bash
git push origin main
```

Hostinger otomatis build ulang dan restart.

Kalau sebuah rilis menambah migrasi baru di `prisma/migrations/`, jalankan migrasi **dulu** (langkah 2) baru push — supaya skema database tidak pernah tertinggal di belakang kode yang sudah jalan.
