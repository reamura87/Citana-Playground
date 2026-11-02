-- F-03: server tidak memvalidasi posisi/jarak untuk game_serang dan game_forage_mulai.
-- F-04: damage dari musuh biasa hanya terjadi bila klien memanggil game_diserang.
--
-- Catatan desain: pergerakan tetap dihitung di klien, sehingga posisi yang dilaporkan
-- tidak sepenuhnya bisa dipercaya. Server kini (a) meminta posisi pada setiap aksi,
-- (b) membatasi kecepatan perpindahan antar-aksi, dan (c) memeriksa jarak ke target.
-- Validasi dapat dimatikan darurat lewat game_config kunci 'validasi_posisi' = 0.

alter table public.game_pemain
  add column if not exists pos_x real,
  add column if not exists pos_y real,
  add column if not exists pos_waktu timestamptz,
  add column if not exists serang_mulai timestamptz;

alter table public.game_forage_titik
  add column if not exists x real,
  add column if not exists y real;

-- Koordinat titik forage (sumber: src/game/peta.js TITIK_FORAGE)
update public.game_forage_titik t set x = v.x, y = v.y
from (values
  (1,150,420),(2,300,380),(3,220,520),(4,420,500),(5,130,720),(6,350,780),(7,250,450),(8,460,420),
  (9,120,840),(10,400,880),(11,200,900),(12,500,700),(13,330,700),(14,160,660),(15,450,800),
  (16,260,780),(17,100,350),(18,490,860),
  (101,520,230),(102,480,190),(103,520,150),(104,470,110),(105,430,225),(106,430,150),
  (107,380,100),(108,390,190),(109,340,230),(110,340,140),(111,290,100),(112,280,200),
  (113,240,150),(114,190,230),(115,180,110),(116,130,170),(117,100,100),(118,90,235)
) as v(id, x, y)
where t.id = v.id;

-- Kotak batas rute patroli (sumber: src/game/peta.js RUTE, indeks = game_spawn.rute)
create table if not exists public.game_rute (
  id    integer primary key,
  x_min real not null, y_min real not null,
  x_max real not null, y_max real not null
);
alter table public.game_rute enable row level security;
revoke all on table public.game_rute from anon, authenticated;
insert into public.game_rute (id, x_min, y_min, x_max, y_max) values
  (0,140,360,480,560),(1,140,720,400,900),(2,260,560,500,800),(3,1140,700,1480,1000),
  (4,1200,780,1420,960),(5,540,280,640,500),(6,620,400,980,620),(7,1080,470,1300,640)
on conflict (id) do update
  set x_min = excluded.x_min, y_min = excluded.y_min, x_max = excluded.x_max, y_max = excluded.y_max;

-- Mencatat posisi pemain dan menolak perpindahan yang mustahil.
-- Posisi terakhir yang lebih tua dari 6 detik diterima apa adanya (masuk/keluar rumah,
-- respawn, muat ulang).
create or replace function public.game_catat_posisi(p_uid uuid, p_x real, p_y real)
  returns void
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_pl game_pemain%rowtype;
  v_detik double precision;
  v_maks double precision;
begin
  if game_cfg_int('validasi_posisi', 1) = 0 then return; end if;
  if p_x is null or p_y is null then
    raise exception 'Versi game kedaluwarsa, muat ulang halaman';
  end if;
  if p_x not between -50 and 2050 or p_y not between -50 and 1650 then
    raise exception 'Posisi tidak valid';
  end if;
  select * into v_pl from game_pemain where id = p_uid;
  if v_pl.pos_waktu is not null then
    v_detik := extract(epoch from now() - v_pl.pos_waktu);
    if v_detik < 6 then
      -- kecepatan jalan klien 110 px/detik; toleransi 35% + 64 px untuk jitter jaringan
      v_maks := 110 * 1.35 * v_detik + 64;
      if sqrt((p_x - v_pl.pos_x) ^ 2 + (p_y - v_pl.pos_y) ^ 2) > v_maks then
        raise exception 'Terlalu cepat';
      end if;
    end if;
  end if;
  update game_pemain set pos_x = p_x, pos_y = p_y, pos_waktu = now() where id = p_uid;
end $$;
revoke all on function public.game_catat_posisi(uuid, real, real) from public, anon, authenticated;

-- ---------- game_serang ----------
drop function if exists public.game_serang(integer);
create or replace function public.game_serang(p_spawn integer, p_x real default null, p_y real default null)
  returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_s game_spawn%rowtype;
  v_m game_musuh%rowtype;
  v_pl game_pemain%rowtype;
  v_k game_kelas%rowtype;
  v_h game_harian%rowtype;
  v_r game_rute%rowtype;
  v_hari date := game_hari_ini();
  v_batas integer := game_cfg_int('batas_pertarungan_harian', 20);
  v_min_persen integer := game_cfg_int('bos_min_persen', 2);
  v_paksa_ms integer := game_cfg_int('balasan_paksa_ms', 8000);
  v_jeda integer;
  v_atk integer;
  v_def integer;
  v_dmg integer;
  v_nyata integer;
  v_hp integer;
  v_mati boolean := false;
  v_berhadiah boolean := false;
  v_xp integer := 0;
  v_gold integer := 0;
  v_naik integer := 0;
  v_sumbangan integer := 0;
  v_total integer;
  v_bagi_xp integer;
  v_bagi_gold integer;
  v_naik_r integer;
  v_balasan jsonb := null;
  v_margin double precision;
  v_mulai timestamptz;
  r record;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  select * into v_s from game_spawn where id = p_spawn for update;
  if not found then raise exception 'Musuh tidak ditemukan'; end if;
  select * into v_m from game_musuh where id = v_s.musuh_id and aktif;
  if not found then raise exception 'Musuh tidak aktif'; end if;
  select * into v_pl from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;
  perform game_segarkan_pemain(v_uid);
  select * into v_pl from game_pemain where id = v_uid;
  if v_pl.mati_sampai is not null and v_pl.mati_sampai > now() then
    raise exception 'Kamu sedang menunggu respawn';
  end if;
  select * into v_k from game_kelas where id = v_pl.kelas;
  v_jeda := greatest(150, 350 + v_k.jeda_tambah_ms - 20 * v_pl.poin_speed);
  if v_pl.terakhir_serang is not null
     and now() - v_pl.terakhir_serang < make_interval(secs => v_jeda / 1000.0) then
    raise exception 'Terlalu cepat';
  end if;

  -- F-03: posisi dan jarak
  perform game_catat_posisi(v_uid, p_x, p_y);
  if game_cfg_int('validasi_posisi', 1) = 1 then
    if v_m.jenis = 'bos' then
      if sqrt((p_x - 1360) ^ 2 + (p_y - 340) ^ 2) > v_k.jangkauan + 46 + 120 then
        raise exception 'Terlalu jauh dari target';
      end if;
    else
      select * into v_r from game_rute where id = v_s.rute;
      if found then
        -- musuh dapat mengejar hingga ~340 px dari rutenya
        v_margin := 340 + v_k.jangkauan + 60;
        if p_x < v_r.x_min - v_margin or p_x > v_r.x_max + v_margin
           or p_y < v_r.y_min - v_margin or p_y > v_r.y_max + v_margin then
          raise exception 'Terlalu jauh dari target';
        end if;
      end if;
    end if;
  end if;

  if v_s.hp = 0 and (v_s.hidup_lagi_pada is null or v_s.hidup_lagi_pada <= now()) then
    update game_spawn
      set hp = v_m.hp, mati_pada = null, hidup_lagi_pada = null,
          siklus = siklus + (case when v_m.jenis = 'bos' then 1 else 0 end)
      where id = v_s.id;
    select * into v_s from game_spawn where id = p_spawn;
  end if;
  if v_s.hp <= 0 then raise exception 'Musuh ini sudah mati'; end if;
  select coalesce(attack, 0) into v_atk from game_item where id = v_pl.senjata_id;
  v_atk := coalesce(v_atk, 0);
  v_dmg := greatest(1,
    floor((4 + v_atk) * v_k.damage_persen / 100.0)::integer + floor(random() * 5)::integer - 2);
  v_nyata := least(v_dmg, v_s.hp);
  v_hp := v_s.hp - v_nyata;
  update game_spawn set hp = v_hp where id = v_s.id;

  -- F-04: awal rangkaian serangan (putus bila jeda > 4 detik)
  v_mulai := case when v_pl.terakhir_serang is null or now() - v_pl.terakhir_serang > interval '4 seconds'
                  then now() else coalesce(v_pl.serang_mulai, now()) end;
  update game_pemain set terakhir_serang = now(), serang_mulai = v_mulai where id = v_uid;

  if v_m.jenis = 'bos' then
    insert into game_bos_damage (spawn_id, siklus, pemain_id, damage)
      values (v_s.id, v_s.siklus, v_uid, v_nyata)
      on conflict (spawn_id, siklus, pemain_id)
      do update set damage = game_bos_damage.damage + excluded.damage;
    select damage into v_sumbangan from game_bos_damage
      where spawn_id = v_s.id and siklus = v_s.siklus and pemain_id = v_uid;
  end if;
  if v_hp = 0 then
    v_mati := true;
    update game_spawn
      set mati_pada = now(),
          hidup_lagi_pada = now() + make_interval(secs => v_m.respawn_detik)
      where id = v_s.id;
    if v_m.jenis = 'bos' then
      select coalesce(sum(damage), 0) into v_total from game_bos_damage
        where spawn_id = v_s.id and siklus = v_s.siklus
          and damage * 100 >= v_m.hp * v_min_persen;
      if v_total > 0 then
        for r in
          select pemain_id, damage from game_bos_damage
          where spawn_id = v_s.id and siklus = v_s.siklus
            and damage * 100 >= v_m.hp * v_min_persen
        loop
          v_bagi_xp := floor(v_m.xp::numeric * r.damage / v_total)::integer;
          v_bagi_gold := floor(v_m.gold::numeric * r.damage / v_total)::integer;
          v_naik_r := game_beri_hadiah(r.pemain_id, v_bagi_xp, v_bagi_gold);
          if r.pemain_id = v_uid then
            v_xp := v_bagi_xp;
            v_gold := v_bagi_gold;
            v_naik := v_naik_r;
            v_berhadiah := true;
          end if;
        end loop;
      end if;
    else
      perform game_catat_progres(v_uid, 'bunuh', v_m.id, 1);
      insert into game_harian (pemain_id, tanggal) values (v_uid, v_hari)
        on conflict (pemain_id, tanggal) do nothing;
      select * into v_h from game_harian where pemain_id = v_uid and tanggal = v_hari;
      if v_h.berhadiah < v_batas then
        v_berhadiah := true;
        v_xp := v_m.xp;
        v_gold := v_m.gold;
        v_naik := game_beri_hadiah(v_uid, v_xp, v_gold);
        update game_harian
          set berhadiah = berhadiah + 1,
              xp_didapat = xp_didapat + v_xp,
              gold_didapat = gold_didapat + v_gold
          where pemain_id = v_uid and tanggal = v_hari;
      end if;
    end if;
  elsif v_m.jenis = 'bos' and random() < 0.5 then
    select coalesce(defense, 0) into v_def from game_item where id = v_pl.armor_id;
    v_def := coalesce(v_def, 0) + v_k.def_bonus;
    v_dmg := greatest(1, floor(
      (floor(v_m.serangan * 0.8)::integer - v_def + floor(random() * 3)::integer - 1)
      * v_k.diterima_persen / 100.0)::integer);
    v_balasan := game_lukai(v_uid, v_dmg);
  elsif v_m.jenis <> 'bos' and v_m.serangan > 0
        and now() - greatest(v_mulai, coalesce(v_pl.terakhir_terluka, '-infinity'::timestamptz))
            >= make_interval(secs => v_paksa_ms / 1000.0) then
    -- F-04: pemain terus menyerang tanpa pernah terluka. Klien jujur melapor lewat
    -- game_diserang setiap 1,2-2,2 detik; tanpa laporan itu server membalas sendiri.
    select coalesce(defense, 0) into v_def from game_item where id = v_pl.armor_id;
    v_def := coalesce(v_def, 0) + v_k.def_bonus;
    v_dmg := greatest(1, floor(
      (v_m.serangan - v_def + floor(random() * 3)::integer - 1) * v_k.diterima_persen / 100.0)::integer);
    v_balasan := game_lukai(v_uid, v_dmg);
  end if;
  return jsonb_build_object(
    'hasil', jsonb_build_object(
      'damage', v_nyata, 'hp', v_hp, 'hp_maks', v_m.hp, 'mati', v_mati,
      'jenis', v_m.jenis, 'nama', v_m.nama, 'berhadiah', v_berhadiah,
      'xp', v_xp, 'gold', v_gold, 'level_naik', v_naik, 'sumbangan', v_sumbangan),
    'balasan', v_balasan,
    'spawn', game_spawn_json(v_s.id),
    'status', game_status());
end $function$;
revoke all on function public.game_serang(integer, real, real) from public, anon;
grant execute on function public.game_serang(integer, real, real) to authenticated, service_role;

-- ---------- game_forage_mulai ----------
drop function if exists public.game_forage_mulai(integer);
create or replace function public.game_forage_mulai(p_titik integer, p_x real default null, p_y real default null)
  returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_pl game_pemain%rowtype;
  v_t game_forage_titik%rowtype;
  v_f game_forage%rowtype;
  v_siap timestamptz;
  v_tier integer;
  v_cepat integer;
  v_durasi numeric;
  v_selesai timestamptz;
  v_hari date := game_hari_ini();
  v_batas integer := game_cfg_int('batas_forage_harian', 150);
  v_n integer;
  v_nama_tier text[] := array['perunggu', 'perak', 'emas', 'berlian', 'obsidian', 'mitril'];
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  if game_cfg_int('forage_aktif', 1) = 0 then raise exception 'Foraging sedang dinonaktifkan'; end if;

  select * into v_pl from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;
  perform game_segarkan_pemain(v_uid);
  select * into v_pl from game_pemain where id = v_uid;
  if v_pl.mati_sampai is not null and v_pl.mati_sampai > now() then
    raise exception 'Tidak bisa mengumpulkan saat gugur';
  end if;

  select * into v_t from game_forage_titik where id = p_titik;
  if not found then raise exception 'Titik tidak ditemukan'; end if;
  select * into v_f from game_forage where id = v_t.forage_id and aktif;
  if not found then raise exception 'Titik ini tidak aktif'; end if;

  -- F-03: harus berada di dekat titik (radius interaksi klien 46 px)
  perform game_catat_posisi(v_uid, p_x, p_y);
  if game_cfg_int('validasi_posisi', 1) = 1 and v_t.x is not null
     and sqrt((p_x - v_t.x) ^ 2 + (p_y - (v_t.y + 4)) ^ 2) > 46 + 60 then
    raise exception 'Terlalu jauh dari titik ini';
  end if;

  select siap_pada into v_siap from game_forage_pemain
    where pemain_id = v_uid and titik_id = p_titik;
  if v_siap is not null and v_siap > now() then raise exception 'Belum tumbuh kembali'; end if;

  insert into game_harian (pemain_id, tanggal) values (v_uid, v_hari)
    on conflict (pemain_id, tanggal) do nothing;
  select forage into v_n from game_harian where pemain_id = v_uid and tanggal = v_hari;
  if v_n >= v_batas then raise exception 'Batas mengumpulkan hari ini (%) sudah tercapai', v_batas; end if;

  if v_f.jenis = 'ore' then
    v_tier := game_tier_alat(v_uid, 'beliung');
    if v_tier < v_f.tier - 1 then
      raise exception 'Butuh Beliung % (atau lebih tinggi) untuk %',
        v_nama_tier[v_f.tier - 1], lower(v_f.nama);
    end if;
    v_cepat := game_kecepatan_alat(v_uid, 'beliung');
  else
    v_cepat := game_kecepatan_alat(v_uid, 'sabit');
  end if;

  v_durasi := greatest(1.5, v_f.durasi_detik * (100 - v_cepat) / 100.0);
  v_selesai := now() + make_interval(secs => v_durasi::double precision);
  update game_pemain set forage_titik = p_titik, forage_selesai = v_selesai where id = v_uid;

  return jsonb_build_object(
    'durasi_ms', round(v_durasi * 1000)::integer,
    'nama', v_f.nama, 'jenis', v_f.jenis, 'selesai_pada', v_selesai);
end $function$;
revoke all on function public.game_forage_mulai(integer, real, real) from public, anon;
grant execute on function public.game_forage_mulai(integer, real, real) to authenticated, service_role;
