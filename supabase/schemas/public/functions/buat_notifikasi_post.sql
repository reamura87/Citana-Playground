CREATE OR REPLACE FUNCTION public.buat_notifikasi_post()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  insert into notifikasi
    (penerima_id, pelaku_id, pelaku_nama, jenis, post_id, balasan_id, sumber_id, cuplikan)
  select p.id, new.penulis_id, new.penulis_nama, 'sebut', new.id, null, new.id, left(new.isi, 80)
  from profil p
  where p.id <> new.penulis_id
    and lower(p.username) in (
      select lower(m.arr[1])
      from regexp_matches(new.isi, '(?:^|[^A-Za-z0-9_])@([A-Za-z0-9_]{3,20})', 'g') as m(arr)
      limit 5)
  on conflict (penerima_id, sumber_id) do nothing;
  return null;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."buat_notifikasi_post"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."buat_notifikasi_post"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."buat_notifikasi_post"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."buat_notifikasi_post"() TO "postgres";
