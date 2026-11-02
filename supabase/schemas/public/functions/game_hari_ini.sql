CREATE OR REPLACE FUNCTION public.game_hari_ini()
  RETURNS date
  LANGUAGE sql
  STABLE
  AS $function$ select (now() at time zone 'Asia/Makassar')::date $function$;

GRANT EXECUTE ON FUNCTION "public"."game_hari_ini"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_hari_ini"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_hari_ini"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_hari_ini"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_hari_ini"() FROM PUBLIC, "anon";
