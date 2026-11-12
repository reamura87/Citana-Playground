CREATE OR REPLACE FUNCTION public.periksa_induk()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  if new.induk_id is not null and not exists (
    select 1 from forum_balasan where id = new.induk_id and post_id = new.post_id
  ) then
    raise exception 'Balasan induk tidak valid';
  end if;
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."periksa_induk"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."periksa_induk"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."periksa_induk"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."periksa_induk"() TO "postgres";
