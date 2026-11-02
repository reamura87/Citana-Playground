CREATE OR REPLACE FUNCTION public.skor_post()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if tg_op = 'INSERT' then
    update forum_post set skor = skor + new.nilai where id = new.post_id;
  elsif tg_op = 'UPDATE' then
    if new.post_id <> old.post_id then raise exception 'Tidak diizinkan'; end if;
    update forum_post set skor = skor + new.nilai - old.nilai where id = new.post_id;
  else
    update forum_post set skor = skor - old.nilai where id = old.post_id;
  end if;
  return null;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."skor_post"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."skor_post"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."skor_post"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."skor_post"() TO "postgres";
