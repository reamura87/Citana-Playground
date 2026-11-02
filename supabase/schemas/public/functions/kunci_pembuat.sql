CREATE OR REPLACE FUNCTION public.kunci_pembuat()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  if pg_trigger_depth() > 1 or auth.uid() is null then return new; end if;
  new.pembuat_id := old.pembuat_id;
  new.pembuat_nama := old.pembuat_nama;
  new.gambar_url := old.gambar_url;
  new.asal := old.asal;
  new.dibuat_pada := old.dibuat_pada;
  new.skor := old.skor;
  new.jumlah_komentar := old.jumlah_komentar;
  new.diperbarui_pada := now();
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."kunci_pembuat"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."kunci_pembuat"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."kunci_pembuat"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."kunci_pembuat"() TO "postgres";
