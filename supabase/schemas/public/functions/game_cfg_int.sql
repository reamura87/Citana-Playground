CREATE OR REPLACE FUNCTION public.game_cfg_int (
  p_kunci  text,
  p_bawaan integer
)
  RETURNS integer
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select coalesce((select (nilai #>> '{}')::integer from game_config where kunci = p_kunci), p_bawaan)
$function$;

GRANT EXECUTE ON FUNCTION "public"."game_cfg_int"(text, integer) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_cfg_int"(text, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_cfg_int"(text, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_cfg_int"(text, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_cfg_int"(text, integer) FROM PUBLIC, "anon";
