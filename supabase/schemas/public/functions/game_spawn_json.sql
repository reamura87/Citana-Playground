CREATE OR REPLACE FUNCTION public.game_spawn_json (
  p_id integer
)
  RETURNS jsonb
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select jsonb_build_object(
    'id', s.id,
    'musuh_id', s.musuh_id,
    'nama', m.nama,
    'jenis', m.jenis,
    'rute', s.rute,
    'fase', s.fase,
    'hp_maks', m.hp,
    'hp', case when s.hp = 0 and (s.hidup_lagi_pada is null or s.hidup_lagi_pada <= now())
               then m.hp else s.hp end,
    'keadaan', case
      when s.hp > 0 then 'hidup'
      when s.hidup_lagi_pada is null or s.hidup_lagi_pada <= now() then 'hidup'
      when s.mati_pada + make_interval(secs => m.mayat_detik) > now() then 'mayat'
      else 'hilang' end,
    'mati_pada', s.mati_pada,
    'hidup_lagi_pada', s.hidup_lagi_pada)
  from game_spawn s join game_musuh m on m.id = s.musuh_id
  where s.id = p_id
$function$;

GRANT EXECUTE ON FUNCTION "public"."game_spawn_json"(integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_spawn_json"(integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_spawn_json"(integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_spawn_json"(integer) FROM PUBLIC, "anon", "authenticated";
