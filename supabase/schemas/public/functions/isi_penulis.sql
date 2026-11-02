CREATE OR REPLACE FUNCTION public.isi_penulis()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare nama text; jumlah int;
begin
  select username into nama from profil where id = auth.uid();
  if nama is null then
    raise exception 'Akun belum punya username';
  end if;

  select (select count(*) from forum_post
            where penulis_id = auth.uid() and dibuat_pada > now() - interval '1 hour')
       + (select count(*) from forum_balasan
            where penulis_id = auth.uid() and dibuat_pada > now() - interval '1 hour')
    into jumlah;
  if jumlah >= 20 and not is_admin() then
    raise exception 'Terlalu banyak kiriman. Coba lagi nanti.';
  end if;

  new := jsonb_populate_record(new, jsonb_build_object(
    'penulis_id', auth.uid(), 'penulis_nama', nama,
    'skor', 0, 'jumlah_balasan', 0, 'dibuat_pada', now()));
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."isi_penulis"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."isi_penulis"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."isi_penulis"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."isi_penulis"() TO "postgres";
