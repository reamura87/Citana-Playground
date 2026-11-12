CREATE OR REPLACE FUNCTION public.game_segarkan_pemain (
  p_pemain uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_pl game_pemain%rowtype;
begin
  select * into v_pl from game_pemain where id = p_pemain;
  if v_pl.mati_sampai is not null and v_pl.mati_sampai <= now() then
    update game_pemain
      set hp = game_hp_maks(poin_hp), hp_waktu = now(), mati_sampai = null
      where id = p_pemain;
  end if;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_segarkan_pemain"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_segarkan_pemain"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_segarkan_pemain"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_segarkan_pemain"(uuid) FROM PUBLIC, "anon", "authenticated";
