CREATE OR REPLACE FUNCTION public.game_valid_kustom (
  p jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  IMMUTABLE
  AS $function$
declare
  v_kulit integer;
  v_rambut integer;
  v_gaya integer;
  v_baju integer;
begin
  if p is null or jsonb_typeof(p) <> 'object' then raise exception 'Data penampilan tidak valid'; end if;
  v_kulit := (p ->> 'kulit')::integer;
  v_rambut := (p ->> 'rambut')::integer;
  v_gaya := (p ->> 'gaya')::integer;
  v_baju := (p ->> 'baju')::integer;
  if v_kulit is null or v_kulit not between 0 and 4 then raise exception 'Warna kulit tidak valid'; end if;
  if v_rambut is null or v_rambut not between 0 and 5 then raise exception 'Warna rambut tidak valid'; end if;
  if v_gaya is null or v_gaya not between 0 and 3 then raise exception 'Gaya rambut tidak valid'; end if;
  if v_baju is null or v_baju not between 0 and 7 then raise exception 'Warna pakaian tidak valid'; end if;
  return jsonb_build_object('kulit', v_kulit, 'rambut', v_rambut, 'gaya', v_gaya, 'baju', v_baju);
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_valid_kustom"(jsonb) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_valid_kustom"(jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_valid_kustom"(jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_valid_kustom"(jsonb) TO "postgres";
