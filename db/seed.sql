-- Contoh data keluarga 5 generasi untuk mencoba aplikasi.
-- PIN demo untuk semua anggota yang bisa login: 1234 (ganti setelah dicoba).
-- pgcrypto's crypt()/gen_salt('bf') menghasilkan hash bcrypt yang kompatibel
-- dengan bcryptjs yang dipakai di sisi aplikasi.

insert into members (id, name, gender, birth_year, city, photo_url, generation, parent_id, spouse_id, pin_hash)
values
  -- Generasi 1: Buyut
  ('11111111-1111-1111-1111-111111111111', 'Suryo Wignyo', 'L', 1935, 'Yogyakarta', 'https://api.dicebear.com/9.x/personas/svg?seed=Suryo', 1, null, '11111111-1111-1111-1111-111111111112', null),
  ('11111111-1111-1111-1111-111111111112', 'Wagini', 'P', 1938, 'Yogyakarta', 'https://api.dicebear.com/9.x/personas/svg?seed=Wagini', 1, null, '11111111-1111-1111-1111-111111111111', null),

  -- Generasi 2: Kakek & Nenek, dan saudara kakek (jadi Om/Tante bagi cucunya)
  ('22222222-2222-2222-2222-222222222221', 'Hartono', 'L', 1958, 'Yogyakarta', 'https://api.dicebear.com/9.x/personas/svg?seed=Hartono', 2, '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', crypt('1234', gen_salt('bf'))),
  ('22222222-2222-2222-2222-222222222222', 'Sulastri', 'P', 1960, 'Yogyakarta', 'https://api.dicebear.com/9.x/personas/svg?seed=Sulastri', 2, null, '22222222-2222-2222-2222-222222222221', null),
  ('22222222-2222-2222-2222-222222222223', 'Broto Wignyo', 'L', 1961, 'Semarang', 'https://api.dicebear.com/9.x/personas/svg?seed=Broto', 2, '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222224', null),
  ('22222222-2222-2222-2222-222222222224', 'Painah', 'P', 1962, 'Semarang', 'https://api.dicebear.com/9.x/personas/svg?seed=Painah', 2, null, '22222222-2222-2222-2222-222222222223', null),

  -- Generasi 3: Orang tua, dan saudara ayah (jadi Om/Tante bagi cucu di gen 4)
  ('33333333-3333-3333-3333-333333333331', 'Budi Hartono', 'L', 1980, 'Jakarta', 'https://api.dicebear.com/9.x/personas/svg?seed=Budi', 3, '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333332', null),
  ('33333333-3333-3333-3333-333333333332', 'Ratna Dewi', 'P', 1982, 'Jakarta', 'https://api.dicebear.com/9.x/personas/svg?seed=Ratna', 3, null, '33333333-3333-3333-3333-333333333331', null),
  ('33333333-3333-3333-3333-333333333333', 'Wulan Hartono', 'P', 1983, 'Bandung', 'https://api.dicebear.com/9.x/personas/svg?seed=Wulan', 3, '22222222-2222-2222-2222-222222222221', null, crypt('1234', gen_salt('bf'))),
  ('33333333-3333-3333-3333-333333333334', 'Dedi Broto', 'L', 1984, 'Semarang', 'https://api.dicebear.com/9.x/personas/svg?seed=Dedi', 3, '22222222-2222-2222-2222-222222222223', null, null),

  -- Generasi 4: Anda & saudara, dan sepupu
  ('44444444-4444-4444-4444-444444444441', 'Andi Budi', 'L', 2004, 'Jakarta', 'https://api.dicebear.com/9.x/personas/svg?seed=Andi', 4, '33333333-3333-3333-3333-333333333331', null, crypt('1234', gen_salt('bf'))),
  ('44444444-4444-4444-4444-444444444442', 'Sari Budi', 'P', 2001, 'Jakarta', 'https://api.dicebear.com/9.x/personas/svg?seed=Sari', 4, '33333333-3333-3333-3333-333333333331', null, crypt('1234', gen_salt('bf'))),
  ('44444444-4444-4444-4444-444444444443', 'Rian Budi', 'L', 2007, 'Jakarta', 'https://api.dicebear.com/9.x/personas/svg?seed=Rian', 4, '33333333-3333-3333-3333-333333333331', null, null),
  ('44444444-4444-4444-4444-444444444444', 'Nadia Wulan', 'P', 2006, 'Bandung', 'https://api.dicebear.com/9.x/personas/svg?seed=Nadia', 4, '33333333-3333-3333-3333-333333333333', null, null),

  -- Generasi 5: Anak & keponakan
  ('55555555-5555-5555-5555-555555555551', 'Kirana Andi', 'P', 2024, 'Jakarta', 'https://api.dicebear.com/9.x/personas/svg?seed=Kirana', 5, '44444444-4444-4444-4444-444444444441', null, null),
  ('55555555-5555-5555-5555-555555555552', 'Bima Sari', 'L', 2022, 'Jakarta', 'https://api.dicebear.com/9.x/personas/svg?seed=Bima', 5, '44444444-4444-4444-4444-444444444442', null, null);
