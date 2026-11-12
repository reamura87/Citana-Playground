CREATE OR REPLACE FUNCTION public.kunci_satua()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  if pg_trigger_depth() > 1 or auth.uid() is null then return new; end if;

  new.slug := old.slug;
  new.jenis := old.jenis;
  new.penulis_id := old.penulis_id;
  new.penulis_nama := old.penulis_nama;
  new.skor := old.skor;
  new.jumlah_komentar := old.jumlah_komentar;
  new.dibuat_pada := old.dibuat_pada;
  new.diperbarui_pada := now();

  if not is_admin()
     and new.thumbnail_url is not null
     and new.thumbnail_url is distinct from old.thumbnail_url
     and not starts_with(new.thumbnail_url, awalan_karya(auth.uid())) then
    raise exception 'Thumbnail harus diunggah lewat situs ini';
  end if;
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."kunci_satua"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."kunci_satua"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."kunci_satua"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."kunci_satua"() TO "postgres";
