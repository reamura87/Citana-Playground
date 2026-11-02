CREATE OR REPLACE FUNCTION public.game_quest_hari_ini()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_level integer;
  v_hari date := game_hari_ini();
  v_per integer := game_cfg_int('quest_per_npc', 2);
  v_npc text;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  select level into v_level from game_pemain where id = v_uid;
  if v_level is null then raise exception 'Belum masuk game'; end if;

  delete from game_quest_pemain where pemain_id = v_uid and tanggal < v_hari - 7;

  foreach v_npc in array array['kapten', 'herbalis'] loop
    if not exists (
      select 1 from game_quest_pemain q join game_quest g on g.id = q.quest_id
      where q.pemain_id = v_uid and q.tanggal = v_hari and g.npc = v_npc) then
      insert into game_quest_pemain (pemain_id, tanggal, quest_id)
        select v_uid, v_hari, g.id from game_quest g
        where g.npc = v_npc and g.aktif and g.min_level <= v_level
        order by md5(v_uid::text || v_hari::text || g.id)
        limit v_per
      on conflict do nothing;
    end if;
  end loop;

  return jsonb_build_object(
    'reset_pada', game_reset_berikut(),
    'quest', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'npc', g.npc, 'jenis', g.jenis, 'target', g.target, 'judul', g.judul,
        'jumlah', g.jumlah, 'xp', g.xp, 'gold', g.gold,
        'progres', q.progres, 'status', q.status) order by g.npc, g.id)
      from game_quest_pemain q join game_quest g on g.id = q.quest_id
      where q.pemain_id = v_uid and q.tanggal = v_hari), '[]'::jsonb));
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_quest_hari_ini"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_quest_hari_ini"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_quest_hari_ini"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_quest_hari_ini"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_quest_hari_ini"() FROM PUBLIC, "anon";
