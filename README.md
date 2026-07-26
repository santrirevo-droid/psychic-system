# Pohon Keluarga

Website pohon keluarga 5 generasi. Setiap anggota login memilih namanya sendiri
lalu memasukkan PIN — setelah masuk, setiap anggota keluarga lain ditampilkan
dengan panggilan yang sesuai relasi terhadap Anda (Buyut, Kakek, Nenek, Om,
Tante, Kakak, Adik, Sepupu, Keponakan, dst), dihitung otomatis dari relasi
orang tua–anak di database.

Anggota dengan status admin punya akses ke dashboard `/admin` untuk menambah,
mengedit, menghapus anggota, dan mengunggah foto langsung dari browser (tanpa SQL).

## Teknologi

- Next.js (App Router) + TypeScript + Tailwind CSS
- Vercel Postgres (Neon) sebagai database
- Vercel Blob untuk penyimpanan foto
- Sesi login berbasis cookie (JWT) + PIN yang di-hash dengan bcrypt

## 1. Menyiapkan database (Vercel Postgres / Neon)

1. Buka project ini di [vercel.com](https://vercel.com) (import dari GitHub dulu jika belum, lihat bagian Deploy di bawah).
2. Masuk ke tab **Storage** project → **Create Database** → pilih **Postgres (Neon)**, lalu hubungkan ke project ini. Vercel otomatis menambahkan environment variable koneksi (`DATABASE_URL` / `POSTGRES_URL`) ke project.
3. Buka database tersebut lewat tombol **Open in Neon / Query** (atau `psql` dengan connection string dari tab Storage), lalu jalankan isi [`db/schema.sql`](db/schema.sql) untuk membuat tabel `members`.
4. (Opsional) Jalankan isi [`db/seed.sql`](db/seed.sql) untuk mengisi contoh data keluarga 5 generasi — semua anggota contoh yang bisa login memakai PIN `1234`, dan "Andi Budi" dijadikan admin contoh.
5. Salin connection string-nya (harus mengandung `?sslmode=require`) untuk dipakai sebagai `DATABASE_URL` di langkah berikut.
6. Kalau database sudah ada dari sebelum fitur admin ini dibuat, jalankan juga [`db/002_add_admin.sql`](db/002_add_admin.sql) untuk menambahkan kolom `is_admin`.

## 2. Menyiapkan penyimpanan foto (Vercel Blob)

1. Masih di tab **Storage** project Vercel → **Create Database** → pilih **Blob**, lalu hubungkan ke project ini. Vercel otomatis menambahkan `BLOB_READ_WRITE_TOKEN`.
2. Untuk dev lokal, tambahkan `BLOB_READ_WRITE_TOKEN` yang sama ke `.env.local` (lihat tab Storage → `.env-vars`, atau jalankan `vercel env pull`).

Store Blob boleh dibuat dengan access **public** maupun **private** — keduanya didukung. Foto selalu ditampilkan lewat `/api/photo` (lihat [`src/app/api/photo/route.ts`](src/app/api/photo/route.ts)), yang mengharuskan viewer login sebelum bisa melihat foto apa pun, jadi foto keluarga tidak pernah punya URL yang bisa diakses publik begitu saja.

## 3. Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local
# isi DATABASE_URL, SESSION_SECRET, dan BLOB_READ_WRITE_TOKEN di .env.local
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — Anda akan diarahkan ke halaman login.

Tips: kalau project sudah ter-link ke Vercel (`vercel link`), Anda bisa menjalankan
`vercel env pull .env.local` untuk otomatis mengambil semua environment variable dari project.

## 4. Menambah / mengubah anggota keluarga

Login sebagai anggota dengan status admin, lalu buka **Kelola Data** (`/admin`). Dari sana bisa:

- Tambah / edit / hapus anggota, termasuk unggah foto langsung dari komputer (atau tempel URL foto).
- Atur PIN login per anggota (kosongkan supaya anggota tersebut tidak bisa login).
- Jadikan anggota lain admin.

Anggota pertama harus dijadikan admin lewat SQL (Neon Query editor atau `psql`), setelah itu semua pengelolaan lain bisa lewat dashboard:

```sql
update members set is_admin = true where id = '<uuid-anggota>';
```

Kalau memakai `db/seed.sql`, akun contoh "Andi Budi" (PIN `1234`) sudah otomatis jadi admin.

Kolom penting saat mengisi form anggota:

- `generation`: angka 1–5, generasi tertua = 1.
- `parent_id` (Orang Tua): salah satu orang tua (cukup satu jalur darah, dipakai untuk menghitung panggilan). Kosongkan untuk generasi tertua atau anggota yang menikah masuk ke keluarga (pasangan).
- `spouse_id` (Pasangan): untuk anggota yang menikah masuk (tidak punya orang tua di pohon ini), field ini penting agar panggilannya ikut mengikuti pasangannya (mis. istri seorang Kakek otomatis terhitung sebagai Nenek).

## 5. Logika panggilan kekerabatan

Ada di [`src/lib/relationship.ts`](src/lib/relationship.ts). Untuk setiap pasangan (Anda, anggota lain), sistem menelusuri jalur `parent_id` masing-masing sampai menemukan leluhur bersama terdekat, lalu menentukan panggilan dari jumlah langkah naik/turun tersebut (mis. naik 1 = Ayah/Ibu, naik 2 = Kakek/Nenek, naik 3 = Buyut; naik-turun berselisih 1 = Om/Tante; turun 1 = Anak; setara & berselisih usia = Kakak/Adik). Pasangan yang menikah masuk (tanpa `parent_id`) diselesaikan lewat jalur pasangannya.

## 6. Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Import project di [vercel.com/new](https://vercel.com/new).
3. Tambahkan tab **Storage** → Postgres (Neon) dan Blob seperti langkah 1–2 di atas (kalau belum), lalu tambahkan `SESSION_SECRET` di Environment Variables project.
4. Deploy.
