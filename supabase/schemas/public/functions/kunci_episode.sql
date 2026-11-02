CREATE OR REPLACE FUNCTION public.kunci_episode()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  if pg_trigger_depth() > 1 or auth.uid() is null then return new; end if;
  new.satua_id := old.satua_id;
  new.nomor := old.nomor;
  new.skor := old.skor;
  new.jumlah_komentar := old.jumlah_komentar;
  new.dibuat_pada := old.dibuat_pada;
  new.diperbarui_pada := now();
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."kunci_episode"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."kunci_episode"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."kunci_episode"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."kunci_episode"() TO "postgres";
