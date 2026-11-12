CREATE OR REPLACE FUNCTION public.tolak_spam_html()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  if pg_trigger_depth() > 1 or auth.uid() is null or is_admin() then return new; end if;
  if new.isi ~* '<a[[:space:]]' or new.isi ~* 'href[[:space:]]*=' then
    raise exception 'Tautan tidak diizinkan di tulisan.';
  end if;
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."tolak_spam_html"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."tolak_spam_html"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."tolak_spam_html"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."tolak_spam_html"() TO "postgres";
