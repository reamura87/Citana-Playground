CREATE OR REPLACE FUNCTION public.hitung_komentar_karya()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if tg_op = 'INSERT' then
    update seni_rupa set jumlah_komentar = jumlah_komentar + 1 where id = new.karya_id;
  else
    update seni_rupa set jumlah_komentar = jumlah_komentar - 1 where id = old.karya_id;
  end if;
  return null;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."hitung_komentar_karya"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."hitung_komentar_karya"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."hitung_komentar_karya"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."hitung_komentar_karya"() TO "postgres";
