CREATE OR REPLACE FUNCTION public.buat_notifikasi_balasan()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  id_pemilik_post uuid;
  id_pemilik_induk uuid;
  cuplik text := left(new.isi, 80);
begin
  select penulis_id into id_pemilik_post from forum_post where id = new.post_id;

  -- 1. Membalas komentar seseorang
  if new.induk_id is not null then
    select penulis_id into id_pemilik_induk from forum_balasan where id = new.induk_id;
    if id_pemilik_induk is not null and id_pemilik_induk <> new.penulis_id then
      insert into notifikasi
        (penerima_id, pelaku_id, pelaku_nama, jenis, post_id, balasan_id, sumber_id, cuplikan)
      values
        (id_pemilik_induk, new.penulis_id, new.penulis_nama, 'balas', new.post_id, new.id, new.id, cuplik)
      on conflict (penerima_id, sumber_id) do nothing;
    end if;
  end if;

  -- 2. Membalas tweet seseorang
  if id_pemilik_post is not null and id_pemilik_post <> new.penulis_id then
    insert into notifikasi
      (penerima_id, pelaku_id, pelaku_nama, jenis, post_id, balasan_id, sumber_id, cuplikan)
    values
      (id_pemilik_post, new.penulis_id, new.penulis_nama, 'balasan', new.post_id, new.id, new.id, cuplik)
    on conflict (penerima_id, sumber_id) do nothing;
  end if;

  -- 3. Menyebut @username (maksimal 5)
  insert into notifikasi
    (penerima_id, pelaku_id, pelaku_nama, jenis, post_id, balasan_id, sumber_id, cuplikan)
  select p.id, new.penulis_id, new.penulis_nama, 'sebut', new.post_id, new.id, new.id, cuplik
  from profil p
  where p.id <> new.penulis_id
    and lower(p.username) in (
      select lower(m.arr[1])
      from regexp_matches(new.isi, '(?:^|[^A-Za-z0-9_])@([A-Za-z0-9_]{3,20})', 'g') as m(arr)
      limit 5)
  on conflict (penerima_id, sumber_id) do nothing;

  return null;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."buat_notifikasi_balasan"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."buat_notifikasi_balasan"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."buat_notifikasi_balasan"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."buat_notifikasi_balasan"() TO "postgres";
