CREATE OR REPLACE FUNCTION public.game_hp_efektif (
  p_hp    integer,
  p_waktu timestamp with time zone,
  p_maks  integer
)
  RETURNS integer
  LANGUAGE sql
  STABLE
  AS $function$
  select least(p_maks, p_hp + floor(extract(epoch from (now() - p_waktu)) / 4)::integer)
$function$;

GRANT EXECUTE ON FUNCTION "public"."game_hp_efektif"(integer, timestamp WITH time zone, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_hp_efektif"(integer, timestamp WITH time zone, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_hp_efektif"(integer, timestamp WITH time zone, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_hp_efektif"(integer, timestamp WITH time zone, integer) FROM PUBLIC, "anon", "authenticated";
