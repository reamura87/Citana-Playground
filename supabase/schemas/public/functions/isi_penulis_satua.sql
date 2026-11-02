CREATE OR REPLACE FUNCTION public.isi_penulis_satua()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare nama text; jumlah int;
begin
  if auth.uid() is null then return new; end if;

  select username into nama from profil where id = auth.uid();
  if nama is null then raise exception 'Akun belum punya username'; end if;

  if not is_admin() then
    select count(*) into jumlah from satua
      where penulis_id = auth.uid() and dibuat_pada > now() - interval '1 hour';
    if jumlah >= 10 then
      raise exception 'Terlalu banyak tulisan dalam satu jam. Coba lagi nanti.';
    end if;
    if new.thumbnail_url is not null
       and not starts_with(new.thumbnail_url, awalan_karya(auth.uid())) then
      raise exception 'Thumbnail harus diunggah lewat situs ini';
    end if;
  end if;

  new.penulis_id := auth.uid();
  new.penulis_nama := nama;
  new.skor := 0;
  new.jumlah_komentar := 0;
  new.dibuat_pada := now();
  new.diperbarui_pada := now();
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."isi_penulis_satua"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."isi_penulis_satua"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."isi_penulis_satua"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."isi_penulis_satua"() TO "postgres";
