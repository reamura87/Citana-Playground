CREATE OR REPLACE FUNCTION public.game_senjata_terbaik (
  p_pemain uuid,
  p_kelas  text
)
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select i.item_id
  from game_inventaris i join game_item it on it.id = i.item_id
  where i.pemain_id = p_pemain and i.jumlah >= 1 and it.kategori = 'senjata'
    and (it.kelas is null or it.kelas = p_kelas)
  order by coalesce(it.attack, 0) desc
  limit 1
$function$;

GRANT EXECUTE ON FUNCTION "public"."game_senjata_terbaik"(uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_senjata_terbaik"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_senjata_terbaik"(uuid, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_senjata_terbaik"(uuid, text) FROM PUBLIC, "anon", "authenticated";
