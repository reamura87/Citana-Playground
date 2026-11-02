CREATE OR REPLACE FUNCTION public.game_xp_butuh (
  p_level integer
)
  RETURNS integer
  LANGUAGE sql
  IMMUTABLE
  AS $function$ select 50 * p_level * p_level $function$;

GRANT EXECUTE ON FUNCTION "public"."game_xp_butuh"(integer) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_xp_butuh"(integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_xp_butuh"(integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_xp_butuh"(integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_xp_butuh"(integer) FROM PUBLIC, "anon";
