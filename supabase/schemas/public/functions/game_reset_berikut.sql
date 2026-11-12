CREATE OR REPLACE FUNCTION public.game_reset_berikut()
  RETURNS timestamp WITH time zone
  LANGUAGE sql
  STABLE
  AS $function$
  select (((now() at time zone 'Asia/Makassar')::date + 1)::timestamp at time zone 'Asia/Makassar')
$function$;

GRANT EXECUTE ON FUNCTION "public"."game_reset_berikut"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_reset_berikut"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_reset_berikut"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_reset_berikut"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_reset_berikut"() FROM PUBLIC, "anon";
