CREATE OR REPLACE FUNCTION public.game_forage_mulai (
  p_titik integer
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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

GRANT EXECUTE ON FUNCTION "public"."game_forage_mulai"(integer) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_forage_mulai"(integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_forage_mulai"(integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_forage_mulai"(integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_forage_mulai"(integer) FROM PUBLIC, "anon";
