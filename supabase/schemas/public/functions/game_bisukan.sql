CREATE OR REPLACE FUNCTION public.game_bisukan (
  p_pemain uuid,
  p_menit  integer
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if not is_admin() then raise exception 'Hanya admin'; end if;
  if p_menit is null or p_menit < 0 or p_menit > 10080 then raise exception 'Durasi tidak valid'; end if;
  update game_pemain
    set bisu_sampai = case when p_menit = 0 then null else now() + make_interval(mins => p_menit) end
    where id = p_pemain;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_bisukan"(uuid, integer) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_bisukan"(uuid, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_bisukan"(uuid, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_bisukan"(uuid, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_bisukan"(uuid, integer) FROM PUBLIC, "anon";
