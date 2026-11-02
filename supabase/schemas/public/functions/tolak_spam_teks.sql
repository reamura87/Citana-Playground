CREATE OR REPLACE FUNCTION public.tolak_spam_teks()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
declare teks text := lower(new.isi);
begin
  if auth.uid() is null or is_admin() then return new; end if;
  if teks ~ '(https?://|www\.|[a-z0-9-]+\.(com|net|org|xyz|top|site|online|link|vip|bet|cc|id)\M)' then
    raise exception 'Tautan tidak diizinkan di sini.';
  end if;
  if teks ~ '(slot gacor|situs slot|slot online|slot88|togel|judi online|judol|sbobet|maxwin|rtp slot)' then
    raise exception 'Konten ini melanggar aturan situs.';
  end if;
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."tolak_spam_teks"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."tolak_spam_teks"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."tolak_spam_teks"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."tolak_spam_teks"() TO "postgres";
