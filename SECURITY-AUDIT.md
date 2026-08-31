# Security Audit — ramacomputer.id

Tanggal: 31 Agustus 2026 · Stack: Next.js 16 · Prisma 7 (driver adapter) · MariaDB 11.8 · better-auth

## Executive Summary

Audit ini mencakup dependency, source code, konfigurasi build, paparan secret, dan konfigurasi runtime.

**Postur source code aplikasi ini kuat.** Tidak ditemukan satu pun pola yang biasanya menjadi celah nyata: tidak ada `$queryRawUnsafe`/`$executeRawUnsafe`, tidak ada `eval`, `child_process`, `exec`, atau `spawn`, tidak ada `dangerouslySetInnerHTML`, dan tidak ada `fetch` server-side ke URL yang dikendalikan pengguna. Seluruh raw query memakai tagged template yang terparameterisasi. Header keamanan sudah lengkap, rate limiting terpasang di semua endpoint POST publik, dan penjagaan rute admin dilakukan di server berdasarkan peran.

Risiko terbesar justru ada di **dependency**, dan satu **bug fungsional yang berdampak pada semua pelanggan** — link produk di pesan WhatsApp mengarah ke `https://0.0.0.0:3000`, alamat yang tidak bisa dibuka siapa pun.

Kerentanan production turun dari **15 menjadi 9**. Sembilan sisanya **tidak ada yang dapat dieksploitasi pada konfigurasi ini** — delapan berasal dari server pengembangan Prisma yang tidak pernah dijalankan aplikasi, satu (`sharp`) memerlukan upgrade major yang sengaja ditunda.

## Jumlah Temuan

| Severity | Sebelum | Sesudah | Keterangan |
|---|---|---|---|
| Critical | 0 | 0 | — |
| High | 11 | 6 | semua sisanya tidak terjangkau runtime |
| Moderate | 4 | 3 | idem |
| Low | 0 | 0 | — |
| Informational | — | 4 | temuan source code, bukan CVE |

Angka di atas adalah `npm audit --omit=dev`, yaitu pohon dependency yang benar-benar terkirim ke production. Termasuk dev, totalnya 19 → 13.

---

## Prioritas Perbaikan

### [F-01] Link produk WhatsApp mengarah ke alamat bind server

- **Severity:** High (dampak bisnis), Medium (keamanan)
- **Confidence:** Confirmed — direproduksi dari pesan yang dikirim pengguna
- **Lokasi file:** `src/app/api/inquiries/whatsapp/route.ts`
- **Nomor baris:** 213 (sebelum perbaikan)
- **Komponen:** Alur inti *lihat produk → hubungi via WhatsApp*
- **Dampak:** Setiap pesan WhatsApp yang dikirim pelanggan memuat `Link Produk: https://0.0.0.0:3000/products/...`. Alamat itu tidak dapat dibuka oleh siapa pun. Ini merusak satu-satunya jalur konversi aplikasi.
- **Bukti teknis:** Kode memakai `request.nextUrl.origin`. Proses Node di Hostinger mendengarkan di `0.0.0.0:3000`, dan di belakang proxy origin tersebut tidak menjadi domain publik.
- **Risiko production:** Seluruh pelanggan terdampak. Selain rusak, alamat bind internal juga bocor ke pihak luar.
- **Perbaikan:** `src/lib/base-url.ts` baru — `getPublicBaseUrl()` mengutamakan `NEXT_PUBLIC_APP_URL`, lalu `BETTER_AUTH_URL`, dan menolak origin bind/loopback (`0.0.0.0`, `127.0.0.1`, `localhost`, `[::]`).
- **Breaking change:** Tidak.
- **Pengujian:** Kirim inquiry WhatsApp dari halaman produk; link harus berawalan `https://ramacomputer.id`.
- **Status:** **Fixed**

### [F-02] `mariadb` membocorkan password cleartext ke MitM meski `ssl: true`

- **Severity:** High (advisory) → **Tidak exploitable pada konfigurasi ini**
- **Confidence:** Confirmed
- **Komponen:** `mariadb` 3.5.2 dan 3.4.5 · direct + transitive
- **Versi aman:** 3.5.3
- **CVE:** CVE-2026-55215
- **Dampak:** Password dikirim cleartext sehingga dapat disadap penyerang di tengah jalur.
- **Kenapa tidak exploitable di sini:** Aplikasi menyambung ke `localhost` — lalu lintas tidak pernah meninggalkan mesin, sehingga tidak ada jalur MitM. **Namun tetap relevan** untuk koneksi migrasi dari komputer lokal ke `srv1417.hstgr.io`, yang melintasi internet.
- **Perbaikan:** `mariadb` dinaikkan ke `^3.5.3`. `@prisma/adapter-mariadb` memaksa 3.4.5, jadi ditambahkan `overrides.mariadb = "^3.5.3"` di `package.json` agar seluruh pohon ter-dedupe ke versi aman.
- **Breaking change:** Tidak (3.4.5 → 3.5.3, dalam major yang sama).
- **Pengujian:** `npm ls mariadb` harus menunjukkan 3.5.3 di semua cabang; `/api/health/db` tetap `ok: true`.
- **Status:** **Fixed**

### [F-03] Empat CVE Next.js: middleware bypass, SSRF, dan DoS

- **Severity:** High
- **Komponen:** `next` 16.2.6 · direct
- **Versi aman:** 16.3.3
- **CVE:** CVE-2026-64642 (middleware/proxy bypass, App Router + Turbopack), CVE-2026-64641 (DoS via Server Actions), CVE-2026-64649 dan CVE-2026-64645 (SSRF)
- **Dampak:** Aplikasi ini memakai App Router, Turbopack, dan Server Actions secara ekstensif — jadi bypass middleware dan DoS Server Actions **relevan langsung**. Dua CVE SSRF kurang relevan karena tidak memakai custom server maupun rewrites.
- **Perbaikan:** `next` dan `eslint-config-next` dinaikkan ke 16.3.3. Ini juga menutup rantai `postcss` (CVE-2026-73646, CVE-2026-45623) yang masuk lewat Next.
- **Breaking change:** Tidak terdeteksi. Minor version. `tsc --noEmit` bersih, `eslint` lolos, build production berhasil.
- **Catatan:** Next 16.3 menambah aturan lint baru `no-location-assign-relative-destination`; muncul 10 **peringatan** (bukan error) di `LogoutButton.tsx` dan `PublicNavbar.tsx`. Tidak memblokir build, layak dirapikan terpisah.
- **Status:** **Fixed**

### [F-04] Account takeover dan stored XSS di better-auth

- **Severity:** High (advisory) → **Tidak exploitable pada konfigurasi ini**
- **Komponen:** `better-auth` 1.6.11 · direct
- **Versi aman:** 1.6.22+
- **GHSA:** GHSA-qq9h-g4jm-xgf3 (pre-account hijacking via magic-link / email-OTP), GHSA-86j7-9j95-vpqj (stored XSS via `javascript:` redirect_uri di oidc-provider dan mcp)
- **Kenapa tidak exploitable di sini:** `src/lib/auth.ts` hanya mengaktifkan `emailAndPassword`. Tidak ada magic link, email OTP, oidc-provider, maupun plugin mcp. Jalur yang rentan tidak pernah terpasang.
- **Perbaikan:** Dinaikkan ke `~1.6.30`. **Sengaja dipin ke jalur 1.6.x**, bukan 1.7.2 yang tersedia — menaikkan pustaka autentikasi satu minor version pada produksi yang baru saja stabil adalah risiko yang tidak sebanding, mengingat kerentanannya sendiri tidak terjangkau.
- **Breaking change:** Tidak. Typecheck, lint, dan build lolos.
- **Pengujian:** Login, logout, dan registrasi harus tetap berfungsi setelah deploy.
- **Status:** **Fixed**

### [F-05] Dependency tak terpakai menarik CLI Prisma ke production

- **Severity:** Moderate (memperluas permukaan serang)
- **Komponen:** `@better-auth/prisma-adapter` 1.6.11 · direct
- **Bukti teknis:** Tidak ada satu pun `import` paket ini di seluruh `src/`, `prisma/`, atau `scripts/`. Kode memakai `better-auth/adapters/prisma`, yaitu subpath dari paket `better-auth` utama. Paket terpisah ini menarik seluruh CLI `prisma` sebagai dependency production.
- **Perbaikan:** Dihapus.
- **Catatan jujur:** Penghapusan ini **tidak** menghilangkan CLI Prisma dari pohon production, karena `@prisma/client@7.8.0` juga menariknya sendiri. Tetap dilakukan sebagai kebersihan dependency dan menghilangkan satu jalur duplikat.
- **Status:** **Fixed**

### [F-06] `sharp` mewarisi kerentanan libvips

- **Severity:** High
- **Komponen:** `sharp` 0.34.5 · direct
- **Versi aman:** 0.35.0+ (**major**)
- **GHSA:** GHSA-f88m-g3jw-g9cj (CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591)
- **Dampak:** `sharp` memproses setiap gambar yang diunggah admin. Gambar berbahaya berpotensi memicu kerentanan libvips.
- **Faktor yang meredam:** Upload **hanya dapat dilakukan admin terautentikasi**, dan `src/lib/upload/storage.ts` sudah memverifikasi magic byte sebelum memproses, membatasi ukuran 5 MB, serta membatasi tipe ke JPEG/PNG/WebP. Penyerang anonim tidak punya jalur ke `sharp`.
- **Kenapa ditunda:** 0.34 → 0.35 adalah **upgrade major**. Perlu pembacaan changelog dan pengujian ulang seluruh alur upload (produk, promo banner, hero banner, logo, favicon) sebelum menyentuh produksi. Menaikkannya otomatis melanggar prinsip yang Anda tetapkan sendiri.
- **Rencana:** Branch terpisah, uji semua jalur upload, baru deploy.
- **Status:** **Accepted risk (sementara)** — perlu tindak lanjut

### [F-07] Delapan kerentanan dari server pengembangan Prisma

- **Severity:** High/Moderate menurut advisory → **Tidak terjangkau runtime**
- **Komponen:** `@prisma/config`, `@prisma/dev`, `deepmerge-ts`, `fast-uri`, `hono`, `@hono/node-server`, `valibot`, `prisma`
- **Jalur:** `@prisma/client@7.8.0` → `prisma@7.8.0` → `@prisma/dev@0.24.3` → `hono`, `fast-uri`, `valibot`
- **Kenapa tidak exploitable:** Seluruhnya berada di kode **server pengembangan lokal Prisma**. Aplikasi production menjalankan `next start` dan tidak pernah memuat `@prisma/dev`. CVE seperti "hono CORS reflects any Origin" atau "path traversal di serve-static" hanya berlaku pada server HTTP yang tidak pernah dijalankan di sini.
- **Perbaikan:** Menunggu rilis Prisma yang tidak lagi menarik CLI ke dalam `@prisma/client`. Tidak dapat diperbaiki dari sisi aplikasi tanpa upgrade major Prisma.
- **Status:** **Accepted risk** — dipantau

### [I-01] Peninjauan source code: tidak ditemukan kerentanan injeksi

- **Severity:** Informational
- **Yang diperiksa dan hasilnya bersih:**

| Pola | Hasil |
|---|---|
| `$queryRawUnsafe` / `$executeRawUnsafe` | tidak ada |
| Raw query dengan string interpolation | tidak ada — semua tagged template |
| `eval`, `child_process`, `exec`, `spawn` | tidak ada |
| `dangerouslySetInnerHTML` | tidak ada |
| `fetch` server-side ke URL dari pengguna | tidak ada |
| PrismaClient dibuat per request | tidak — singleton `globalThis` |
| `$disconnect` per request | tidak — hanya di skrip CLI sekali jalan |
| IO berat di dalam transaksi | tidak ada |

- **Status:** **Informational**

### [I-02] Konfigurasi keamanan runtime sudah baik

- Header di `next.config.ts`: CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` — semua terpasang untuk seluruh rute.
- Halaman `/admin`, `/api`, dan halaman auth memakai `Cache-Control: private, no-store`.
- Image optimizer dimatikan di production, menghapus permukaan SSRF open-proxy.
- Rate limiting aktif di tujuh endpoint POST publik.
- Penjagaan admin dilakukan server-side berbasis peran (`requireAdminSession`, `requireSuperAdminSession`).
- **Kekurangan:** CSP masih memakai `'unsafe-inline'` untuk script dan style. Memperketatnya butuh nonce, perubahan besar, dan sudah didokumentasikan sebagai keputusan sadar di `next.config.ts`.
- **Status:** **Informational**

### [I-03] Belum ada HSTS

- **Severity:** Low
- HTTPS sudah aktif, tetapi `Strict-Transport-Security` belum diset di `next.config.ts`.
- **Rekomendasi:** Tambahkan setelah HTTPS terbukti stabil beberapa hari. Menambahkannya terlalu dini akan mengunci pengunjung ke HTTPS bahkan jika sertifikat bermasalah.
- **Status:** **Open**

### [I-04] Secret yang perlu dirotasi

- **Severity:** High (kebersihan operasional)
- Tidak ditemukan secret ter-hardcode di source code. `.gitignore` menutup seluruh `.env*` kecuali berkas `*.example`, dan sudah diverifikasi `git` menolak menambahkan `.env`.
- Namun **password database dan `BETTER_AUTH_SECRET` sempat melintas di percakapan pengembangan**, sehingga harus dianggap terpapar.
- **Status:** **Open** — lihat Secret Rotation Plan

---

## Dependency Fix Plan

| Package | Sebelum | Sesudah | Risiko | Breaking change | Tindakan |
|---|---|---|---|---|---|
| `next` | 16.2.6 | 16.3.3 | Rendah | Tidak | Dinaikkan |
| `eslint-config-next` | 16.2.6 | 16.3.3 | Rendah | Tidak | Dinaikkan |
| `better-auth` | 1.6.11 | ~1.6.30 | Rendah | Tidak | Dipin ke jalur 1.6.x |
| `mariadb` | 3.5.2 | ^3.5.3 | Rendah | Tidak | Dinaikkan + `overrides` |
| `@better-auth/prisma-adapter` | 1.6.11 | — | Nihil | Tidak | Dihapus (tak terpakai) |
| `sharp` | 0.34.5 | 0.35.4 | **Sedang** | **Ya (major)** | **Ditunda** |
| Rantai `@prisma/dev` | — | — | Nihil di runtime | — | Menunggu rilis Prisma |

## Source Code Fix Plan

| Item | Status |
|---|---|
| Base URL kanonik untuk link keluar | Selesai — `src/lib/base-url.ts` |
| Peringatan lint `no-location-assign-relative-destination` | Terbuka — 2 berkas, bukan masalah keamanan |
| Header HSTS | Terbuka |
| CSP berbasis nonce | Ditunda — keputusan sadar |
| Pagination `findMany` di `categories/[slug]` dan `/vouchers` | Terbuka — bukan penyebab masalah apa pun saat ini |

## Secret Rotation Plan

Nilai tidak ditampilkan di dokumen ini.

| Secret | Alasan | Prioritas |
|---|---|---|
| Password user MySQL `u694356768_ekatalog` | Melintas di percakapan pengembangan | Tinggi |
| `BETTER_AUTH_SECRET` | Melintas di percakapan pengembangan | Tinggi |

Prosedur: ganti password di hPanel → perbarui `DATABASE_URL` di Environment Variables (host tetap `localhost`) → restart. Untuk `BETTER_AUTH_SECRET`, buat nilai baru 32 byte lalu restart; seluruh sesi yang ada akan logout, jadi lakukan selagi pengguna masih sedikit.

## Production Verification Checklist

- [ ] `/api/health/db` mengembalikan `ok: true`
- [ ] `/api/health` melaporkan `status: healthy`
- [ ] `/`, `/products`, `/categories`, `/login`, `/register` mengembalikan 200
- [ ] Login dan registrasi berfungsi (memvalidasi upgrade better-auth)
- [ ] `/admin` dapat diakses oleh SUPER_ADMIN
- [ ] Link WhatsApp memuat `https://ramacomputer.id`, bukan `0.0.0.0:3000`
- [ ] Log bersih dari P2024, P1001, P1008, ECONNREFUSED, dan "Too many connections"

## Remaining Risks

1. **`sharp` belum dinaikkan.** Hanya terjangkau lewat upload admin terautentikasi dengan verifikasi magic byte. Perlu upgrade major di branch terpisah.
2. **Delapan CVE dari rantai `@prisma/dev`.** Tidak terjangkau runtime; menunggu perbaikan hulu Prisma.
3. **CSP masih `'unsafe-inline'`.** Melemahkan pertahanan XSS berlapis, meski tidak ada vektor XSS yang ditemukan di source code.
4. **Belum ada HSTS.**
5. **Secret belum dirotasi.**
6. **Redis tidak tersedia**, sehingga rate limiting bersifat in-memory. Benar untuk satu proses, tetapi tidak akan bertahan jika aplikasi diskalakan ke banyak instance.

---

## Status Database

Tidak ada perintah destruktif yang dijalankan selama audit ini. Tidak ada `migrate reset`, `db push`, `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, atau perubahan data. Satu-satunya operasi database adalah `SELECT 1` dan pembacaan `information_schema`.
