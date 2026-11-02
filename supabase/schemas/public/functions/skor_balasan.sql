CREATE OR REPLACE FUNCTION public.skor_balasan()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if tg_op = 'INSERT' then
    update forum_balasan set skor = skor + new.nilai where id = new.balasan_id;
  elsif tg_op = 'UPDATE' then
    if new.balasan_id <> old.balasan_id then raise exception 'Tidak diizinkan'; end if;
    update forum_balasan set skor = skor + new.nilai - old.nilai where id = new.balasan_id;
  else
    update forum_balasan set skor = skor - old.nilai where id = old.balasan_id;
  end if;
  return null;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."skor_balasan"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."skor_balasan"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."skor_balasan"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."skor_balasan"() TO "postgres";
