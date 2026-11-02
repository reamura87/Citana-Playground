CREATE OR REPLACE FUNCTION public.hitung_suara_episode()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if tg_op = 'INSERT' then
    update satua_episode set skor = skor + 1 where id = new.episode_id;
  else
    update satua_episode set skor = skor - 1 where id = old.episode_id;
  end if;
  return null;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."hitung_suara_episode"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."hitung_suara_episode"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."hitung_suara_episode"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."hitung_suara_episode"() TO "postgres";
