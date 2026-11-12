CREATE OR REPLACE FUNCTION public.hitung_komentar()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare delta int := case when tg_op = 'INSERT' then 1 else -1 end;
        r komentar_satua;
begin
  r := case when tg_op = 'INSERT' then new else old end;
  if r.satua_id is not null then
    update satua set jumlah_komentar = jumlah_komentar + delta where id = r.satua_id;
  else
    update satua_episode set jumlah_komentar = jumlah_komentar + delta where id = r.episode_id;
  end if;
  return null;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."hitung_komentar"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."hitung_komentar"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."hitung_komentar"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."hitung_komentar"() TO "postgres";
