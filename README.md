# Pohon Keluarga

Website pohon keluarga 5 generasi. Setiap anggota login memilih namanya sendiri
lalu memasukkan PIN — setelah masuk, setiap anggota keluarga lain ditampilkan
dengan panggilan yang sesuai relasi terhadap Anda (Buyut, Kakek, Nenek, Om,
Tante, Kakak, Adik, Sepupu, Keponakan, dst), dihitung otomatis dari relasi
orang tua–anak di database.

## Teknologi

- Next.js (App Router) + TypeScript + Tailwind CSS
- Vercel Postgres (Neon) sebagai database
- Sesi login berbasis cookie (JWT) + PIN yang di-hash dengan bcrypt

## 1. Menyiapkan database (Vercel Postgres / Neon)

1. Buka project ini di [vercel.com](https://vercel.com) (import dari GitHub dulu jika belum, lihat bagian Deploy di bawah).
2. Masuk ke tab **Storage** project → **Create Database** → pilih **Postgres (Neon)**, lalu hubungkan ke project ini. Vercel otomatis menambahkan environment variable koneksi (`DATABASE_URL` / `POSTGRES_URL`) ke project.
3. Buka database tersebut lewat tombol **Open in Neon / Query** (atau `psql` dengan connection string dari tab Storage), lalu jalankan isi [`db/schema.sql`](db/schema.sql) untuk membuat tabel `members`.
4. (Opsional) Jalankan isi [`db/seed.sql`](db/seed.sql) untuk mengisi contoh data keluarga 5 generasi — semua anggota contoh yang bisa login memakai PIN `1234`.
5. Salin connection string-nya (harus mengandung `?sslmode=require`) untuk dipakai sebagai `DATABASE_URL` di langkah berikut.

## 2. Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local
# isi DATABASE_URL (dari Neon/Vercel Storage) dan SESSION_SECRET di .env.local
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — Anda akan diarahkan ke halaman login.

Tips: kalau project sudah ter-link ke Vercel (`vercel link`), Anda bisa menjalankan
`vercel env pull .env.local` untuk otomatis mengambil `DATABASE_URL` dari project.

## 3. Menambah / mengubah anggota keluarga

Belum ada halaman admin — kelola data langsung lewat SQL (Neon Query editor, atau `psql`):

```sql
insert into members (name, gender, birth_year, city, photo_url, generation, parent_id, spouse_id, pin_hash)
values (
  'Nama Anggota', 'L', 1990, 'Kota',
  'https://url-foto.jpg',
  4,
  '<uuid-orang-tua>',
  null,
  crypt('1234', gen_salt('bf'))  -- kosongkan (null) jika anggota ini tidak perlu bisa login
);
```

Kolom penting:

- `generation`: angka 1–5, generasi tertua = 1.
- `parent_id`: `id` salah satu orang tua (cukup satu jalur darah, dipakai untuk menghitung panggilan). Kosongkan untuk generasi tertua atau anggota yang menikah masuk ke keluarga (pasangan).
- `spouse_id`: `id` pasangan. Untuk anggota yang menikah masuk (tidak punya `parent_id`), field ini penting agar panggilannya ikut mengikuti pasangannya (mis. istri seorang Kakek otomatis terhitung sebagai Nenek).
- `pin_hash`: hasil `crypt('PIN', gen_salt('bf'))`. Kosongkan (`null`) untuk anggota yang belum/tidak perlu login.

## 4. Logika panggilan kekerabatan

Ada di [`src/lib/relationship.ts`](src/lib/relationship.ts). Untuk setiap pasangan (Anda, anggota lain), sistem menelusuri jalur `parent_id` masing-masing sampai menemukan leluhur bersama terdekat, lalu menentukan panggilan dari jumlah langkah naik/turun tersebut (mis. naik 1 = Ayah/Ibu, naik 2 = Kakek/Nenek, naik 3 = Buyut; naik-turun berselisih 1 = Om/Tante; turun 1 = Anak; setara & berselisih usia = Kakak/Adik). Pasangan yang menikah masuk (tanpa `parent_id`) diselesaikan lewat jalur pasangannya.

## 5. Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Import project di [vercel.com/new](https://vercel.com/new).
3. Tambahkan tab **Storage** → Postgres (Neon) seperti langkah 1 di atas (kalau belum), lalu tambahkan `SESSION_SECRET` di Environment Variables project.
4. Deploy.
