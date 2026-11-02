CREATE OR REPLACE FUNCTION public.game_dunia()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  perform game_kembalikan_hadiah(v_uid);
  return jsonb_build_object(
    'waktu_server', now(),
    'spawn', coalesce((select jsonb_agg(game_spawn_json(s.id) order by s.id)
        from game_spawn s join game_musuh m on m.id = s.musuh_id where m.aktif), '[]'::jsonb),
    'sumbangan_bos', coalesce((select sum(d.damage) from game_bos_damage d
        join game_spawn s on s.id = d.spawn_id and s.siklus = d.siklus
        where d.pemain_id = v_uid and s.jenis = 'bos'), 0),
    'mp', jsonb_build_object(
      'aktif', game_cfg_int('mp_aktif', 1) = 1,
      'maks', game_cfg_int('mp_maks_per_ruang', 12),
      'chat', game_cfg_int('chat_aktif', 1) = 1),
    'forage', jsonb_build_object(
      'kosong', coalesce((select jsonb_agg(jsonb_build_object('id', titik_id, 'siap_pada', siap_pada))
          from game_forage_pemain where pemain_id = v_uid and siap_pada > now()), '[]'::jsonb),
      'tambang', (select tambang_total from game_pemain where id = v_uid),
      'tumbuhan', (select tumbuhan_total from game_pemain where id = v_uid),
      'hari_ini', coalesce((select forage from game_harian
          where pemain_id = v_uid and tanggal = game_hari_ini()), 0),
      'batas', game_cfg_int('batas_forage_harian', 150)),
    'status', game_status());
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_dunia"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_dunia"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_dunia"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_dunia"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_dunia"() FROM PUBLIC, "anon";
