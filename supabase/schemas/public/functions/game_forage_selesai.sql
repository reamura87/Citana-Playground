CREATE OR REPLACE FUNCTION public.game_forage_selesai()
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
  v_item game_item%rowtype;
  v_jumlah integer;
  v_siap timestamptz;
  v_naik integer;
  v_hari date := game_hari_ini();
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  select * into v_pl from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;
  if v_pl.forage_titik is null then raise exception 'Kamu tidak sedang mengumpulkan'; end if;
  if v_pl.mati_sampai is not null and v_pl.mati_sampai > now() then
    raise exception 'Pengumpulan dibatalkan karena kamu gugur';
  end if;
  if v_pl.forage_selesai > now() + interval '400 milliseconds' then raise exception 'Belum selesai'; end if;
  if v_pl.forage_selesai < now() - interval '5 minutes' then
    raise exception 'Waktu pengumpulan habis, ulangi lagi';
  end if;

  select * into v_t from game_forage_titik where id = v_pl.forage_titik;
  select * into v_f from game_forage where id = v_t.forage_id;
  select * into v_item from game_item where id = v_f.item_hasil;
  v_jumlah := v_f.jumlah_min + floor(random() * (v_f.jumlah_maks - v_f.jumlah_min + 1))::integer;

  insert into game_inventaris (pemain_id, item_id, jumlah) values (v_uid, v_f.item_hasil, v_jumlah)
    on conflict (pemain_id, item_id)
    do update set jumlah = game_inventaris.jumlah + excluded.jumlah;

  v_siap := now() + make_interval(secs => v_f.respawn_detik);
  insert into game_forage_pemain (pemain_id, titik_id, siap_pada) values (v_uid, v_t.id, v_siap)
    on conflict (pemain_id, titik_id) do update set siap_pada = excluded.siap_pada;

  update game_pemain
    set forage_titik = null, forage_selesai = null,
        tambang_total = tambang_total + (case when v_f.jenis = 'ore' then 1 else 0 end),
        tumbuhan_total = tumbuhan_total + (case when v_f.jenis = 'tumbuhan' then 1 else 0 end)
    where id = v_uid;

  insert into game_harian (pemain_id, tanggal) values (v_uid, v_hari)
    on conflict (pemain_id, tanggal) do nothing;
  update game_harian set forage = forage + 1 where pemain_id = v_uid and tanggal = v_hari;

  perform game_catat_progres(v_uid, 'kumpul', v_f.item_hasil, v_jumlah);
  v_naik := game_beri_hadiah(v_uid, v_f.xp, 0);

  return jsonb_build_object(
    'item', v_item.nama, 'jumlah', v_jumlah, 'xp', v_f.xp, 'level_naik', v_naik,
    'siap_pada', v_siap,
    'tambang', (select tambang_total from game_pemain where id = v_uid),
    'tumbuhan', (select tumbuhan_total from game_pemain where id = v_uid),
    'hari_ini', (select forage from game_harian where pemain_id = v_uid and tanggal = v_hari),
    'status', game_status());
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_forage_selesai"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_forage_selesai"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_forage_selesai"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_forage_selesai"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_forage_selesai"() FROM PUBLIC, "anon";
