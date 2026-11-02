CREATE OR REPLACE FUNCTION public.game_upgrade_rumah()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_level integer;
  v_next game_rumah_level%rowtype;
  v_n integer;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  perform 1 from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;

  select level into v_level from game_rumah where pemain_id = v_uid;
  select * into v_next from game_rumah_level where level = v_level + 1;
  if not found then raise exception 'Rumah sudah di level maksimum'; end if;

  update game_pemain set gold = gold - v_next.biaya_gold, diperbarui_pada = now()
    where id = v_uid and gold >= v_next.biaya_gold;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Gold tidak cukup'; end if;

  update game_rumah set level = v_next.level where pemain_id = v_uid;
  return game_status();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_upgrade_rumah"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_upgrade_rumah"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_upgrade_rumah"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_upgrade_rumah"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_upgrade_rumah"() FROM PUBLIC, "anon";
