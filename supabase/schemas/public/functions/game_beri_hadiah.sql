CREATE OR REPLACE FUNCTION public.game_beri_hadiah (
  p_pemain uuid,
  p_xp     integer,
  p_gold   integer
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_pl game_pemain%rowtype;
  v_xp integer;
  v_level integer;
  v_naik integer := 0;
begin
  select * into v_pl from game_pemain where id = p_pemain for update;
  if not found then return 0; end if;
  v_xp := v_pl.xp + p_xp;
  v_level := v_pl.level;
  while v_xp >= game_xp_butuh(v_level) and v_level < 50 loop
    v_xp := v_xp - game_xp_butuh(v_level);
    v_level := v_level + 1;
    v_naik := v_naik + 1;
  end loop;
  update game_pemain
    set xp = v_xp, level = v_level, gold = gold + p_gold,
        poin_sisa = poin_sisa + v_naik * 3, diperbarui_pada = now()
    where id = p_pemain;
  return v_naik;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_beri_hadiah"(uuid, integer, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_beri_hadiah"(uuid, integer, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_beri_hadiah"(uuid, integer, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_beri_hadiah"(uuid, integer, integer) FROM PUBLIC, "anon", "authenticated";
