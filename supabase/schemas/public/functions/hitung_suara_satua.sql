CREATE OR REPLACE FUNCTION public.hitung_suara_satua()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if tg_op = 'INSERT' then
    update satua set skor = skor + 1 where id = new.satua_id;
  else
    update satua set skor = skor - 1 where id = old.satua_id;
  end if;
  return null;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."hitung_suara_satua"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."hitung_suara_satua"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."hitung_suara_satua"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."hitung_suara_satua"() TO "postgres";
