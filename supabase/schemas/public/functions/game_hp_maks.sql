CREATE OR REPLACE FUNCTION public.game_hp_maks (
  p_poin_hp integer
)
  RETURNS integer
  LANGUAGE sql
  IMMUTABLE
  AS $function$ select 60 + p_poin_hp * 10 $function$;

GRANT EXECUTE ON FUNCTION "public"."game_hp_maks"(integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_hp_maks"(integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_hp_maks"(integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_hp_maks"(integer) FROM PUBLIC, "anon", "authenticated";
