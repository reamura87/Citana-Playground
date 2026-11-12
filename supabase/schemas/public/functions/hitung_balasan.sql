CREATE OR REPLACE FUNCTION public.hitung_balasan()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if tg_op = 'INSERT' then
    update forum_post set jumlah_balasan = jumlah_balasan + 1 where id = new.post_id;
  else
    update forum_post set jumlah_balasan = jumlah_balasan - 1 where id = old.post_id;
  end if;
  return null;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."hitung_balasan"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."hitung_balasan"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."hitung_balasan"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."hitung_balasan"() TO "postgres";
