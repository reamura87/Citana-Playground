CREATE OR REPLACE FUNCTION public.game_forage_batal()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if auth.uid() is null then raise exception 'Harus masuk dulu'; end if;
  update game_pemain set forage_titik = null, forage_selesai = null where id = auth.uid();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_forage_batal"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_forage_batal"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_forage_batal"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_forage_batal"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_forage_batal"() FROM PUBLIC, "anon";
