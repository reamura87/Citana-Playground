CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (select 1 from profil where id = auth.uid() and peran = 'admin');
$function$;

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."is_admin"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "postgres";
