CREATE OR REPLACE FUNCTION public.naikkan_serial()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if new.terbit then
    update satua set diperbarui_pada = now() where id = new.satua_id;
  end if;
  return null;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."naikkan_serial"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."naikkan_serial"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."naikkan_serial"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."naikkan_serial"() TO "postgres";
