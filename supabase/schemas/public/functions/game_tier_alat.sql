CREATE OR REPLACE FUNCTION public.game_tier_alat (
  p_pemain uuid,
  p_jenis  text
)
  RETURNS integer
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select coalesce(max(a.tier), 0)
  from game_inventaris i join game_alat a on a.item_id = i.item_id
  where i.pemain_id = p_pemain and i.jumlah >= 1 and a.jenis = p_jenis
$function$;

GRANT EXECUTE ON FUNCTION "public"."game_tier_alat"(uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_tier_alat"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_tier_alat"(uuid, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_tier_alat"(uuid, text) FROM PUBLIC, "anon", "authenticated";
