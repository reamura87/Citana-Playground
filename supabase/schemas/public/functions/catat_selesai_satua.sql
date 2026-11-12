CREATE OR REPLACE FUNCTION public.catat_selesai_satua()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  if new.selesai then
    if tg_op = 'INSERT' or not old.selesai then new.selesai_pada := now(); end if;
  else
    new.selesai_pada := null;
  end if;
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."catat_selesai_satua"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."catat_selesai_satua"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."catat_selesai_satua"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."catat_selesai_satua"() TO "postgres";
