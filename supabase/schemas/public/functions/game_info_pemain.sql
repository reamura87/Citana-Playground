CREATE OR REPLACE FUNCTION public.game_info_pemain (
  p_ids uuid[]
)
  RETURNS TABLE (
    id       uuid,
    username text,
    kelas    text,
    kustom   jsonb
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select p.id, pr.username, p.kelas, p.kustom
  from game_pemain p join profil pr on pr.id = p.id
  where auth.uid() is not null and p.id = any(p_ids[1:20])
$function$;

GRANT EXECUTE ON FUNCTION "public"."game_info_pemain"(uuid[]) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_info_pemain"(uuid[]) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_info_pemain"(uuid[]) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_info_pemain"(uuid[]) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_info_pemain"(uuid[]) FROM PUBLIC, "anon";
