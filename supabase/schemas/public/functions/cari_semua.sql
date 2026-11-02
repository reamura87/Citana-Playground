CREATE OR REPLACE FUNCTION public.cari_semua (
  q text
)
  RETURNS TABLE (
    jenis      text,
    id         uuid,
    slug       text,
    judul      text,
    ringkasan  text,
    gambar_url text,
    penulis    text,
    waktu      timestamp with time zone,
    post_id    uuid
  )
  LANGUAGE sql
  STABLE
  SET search_path TO 'public'
  AS $function$
  select * from (
    select 'satua'::text as jenis, s.id as id, s.slug as slug, s.judul as judul,
           left(regexp_replace(s.isi, '<[^>]+>', ' ', 'g'), 160) as ringkasan,
           s.thumbnail_url as gambar_url, null::text as penulis,
           s.diperbarui_pada as waktu, null::uuid as post_id
    from satua s
    where s.terbit and length(trim(q)) >= 2 and (
      strpos(lower(s.judul), lower(trim(q))) > 0
      or strpos(lower(s.kategori), lower(trim(q))) > 0
      or strpos(lower(regexp_replace(s.isi, '<[^>]+>', ' ', 'g')), lower(trim(q))) > 0)
    union all
    select 'seniRupa'::text, r.id, null::text, r.nama, r.kategori,
           r.gambar_url, r.pembuat_nama, r.diperbarui_pada, null::uuid
    from seni_rupa r
    where length(trim(q)) >= 2 and (
      strpos(lower(r.nama), lower(trim(q))) > 0
      or strpos(lower(r.kategori), lower(trim(q))) > 0
      or strpos(lower(r.pembuat_nama), lower(trim(q))) > 0)
    union all
    select 'forum'::text, p.id, null::text, left(p.isi, 120), null::text,
           p.gambar_url, p.penulis_nama, p.dibuat_pada, null::uuid
    from forum_post p
    where length(trim(q)) >= 2 and (
      strpos(lower(p.isi), lower(trim(q))) > 0
      or strpos(lower(p.penulis_nama), lower(trim(q))) > 0)
    union all
    select 'balasan'::text, b.id, null::text, left(b.isi, 120), null::text,
           b.gambar_url, b.penulis_nama, b.dibuat_pada, b.post_id
    from forum_balasan b
    where length(trim(q)) >= 2 and (
      strpos(lower(b.isi), lower(trim(q))) > 0
      or strpos(lower(b.penulis_nama), lower(trim(q))) > 0)
  ) hasil
  order by waktu desc
  limit 60;
$function$;

GRANT EXECUTE ON FUNCTION "public"."cari_semua"(text) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."cari_semua"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."cari_semua"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."cari_semua"(text) TO "postgres";
