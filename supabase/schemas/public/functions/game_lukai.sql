CREATE OR REPLACE FUNCTION public.game_lukai (
  p_pemain uuid,
  p_dmg    integer
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_pl game_pemain%rowtype;
  v_maks integer;
  v_hp integer;
  v_baru integer;
  v_mati boolean := false;
  v_sampai timestamptz;
begin
  select * into v_pl from game_pemain where id = p_pemain for update;
  v_maks := game_hp_maks(v_pl.poin_hp);
  v_hp := game_hp_efektif(v_pl.hp, v_pl.hp_waktu, v_maks);
  v_baru := greatest(0, v_hp - p_dmg);
  if v_baru = 0 then
    v_mati := true;
    v_sampai := now() + interval '5 minutes';
    update game_pemain
      set hp = 0, hp_waktu = now(), mati_sampai = v_sampai, terakhir_terluka = now()
      where id = p_pemain;
  else
    update game_pemain
      set hp = v_baru, hp_waktu = now(), terakhir_terluka = now()
      where id = p_pemain;
  end if;
  return jsonb_build_object('damage', p_dmg, 'hp', v_baru, 'hp_maks', v_maks,
                            'mati', v_mati, 'mati_sampai', v_sampai);
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_lukai"(uuid, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_lukai"(uuid, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_lukai"(uuid, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_lukai"(uuid, integer) FROM PUBLIC, "anon", "authenticated";
