-- Kuota harian untuk asisten AI situs. Jalankan sekali di SQL Editor.
create table asisten_pakai (
  pengguna_id uuid not null references auth.users(id) on delete cascade,
  tanggal date not null,
  jumlah integer not null default 0,
  primary key (pengguna_id, tanggal)
);
alter table asisten_pakai enable row level security;
revoke all on asisten_pakai from anon, authenticated;

insert into game_config (kunci, nilai) values
  ('asisten_aktif', '1'),              -- 0 = matikan asisten untuk semua orang
  ('asisten_batas_harian', '30'),      -- pesan per pengguna per hari
  ('asisten_batas_global', '80')       -- total pesan semua pengguna per hari. Untuk penyedia gratis, hitung dari jatah token harian (jatah / ±2.000 token per pesan)
on conflict (kunci) do nothing;

-- Memeriksa login, saklar, dan kuota; lalu menambah hitungan. Dipanggil oleh server /api/asisten.
create function asisten_hitung() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_hari date := game_hari_ini();
  v_batas integer := game_cfg_int('asisten_batas_harian', 30);
  v_global integer := game_cfg_int('asisten_batas_global', 1500);
  v_n integer;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  if game_cfg_int('asisten_aktif', 1) = 0 then raise exception 'Asisten sedang istirahat'; end if;
  if (select coalesce(sum(jumlah), 0) from asisten_pakai where tanggal = v_hari) >= v_global then
    raise exception 'Asisten sedang istirahat hari ini';
  end if;
  insert into asisten_pakai (pengguna_id, tanggal, jumlah) values (v_uid, v_hari, 1)
    on conflict (pengguna_id, tanggal)
    do update set jumlah = asisten_pakai.jumlah + 1 where asisten_pakai.jumlah < v_batas
    returning jumlah into v_n;
  if v_n is null then raise exception 'Jatah obrolan hari ini habis'; end if;
  return jsonb_build_object('terpakai', v_n, 'batas', v_batas);
end $$;

revoke all on function asisten_hitung() from public, anon;
grant execute on function asisten_hitung() to authenticated;

-- Mengembalikan satu jatah bila semua penyedia AI gagal menjawab (dipanggil server)
create function asisten_kembalikan() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Harus masuk dulu'; end if;
  update asisten_pakai set jumlah = greatest(0, jumlah - 1)
    where pengguna_id = auth.uid() and tanggal = game_hari_ini();
end $$;

revoke all on function asisten_kembalikan() from public, anon;
grant execute on function asisten_kembalikan() to authenticated;

-- Opsional, jalankan sesekali untuk merapikan: delete from asisten_pakai where tanggal < current_date - 7;
