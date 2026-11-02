CREATE OR REPLACE FUNCTION public.isi_pembuat()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  nama_pengguna text;
  jumlah int;
begin
  select username into nama_pengguna from profil where id = auth.uid();
  if nama_pengguna is null then
    raise exception 'Username belum diatur di tabel profil';
  end if;

  if not is_admin() then
    select count(*) into jumlah from seni_rupa
      where pembuat_id = auth.uid() and dibuat_pada > now() - interval '1 hour';
    if jumlah >= 10 then
      raise exception 'Terlalu banyak karya dalam satu jam. Coba lagi nanti.';
    end if;
    if new.gambar_url is null
       or not starts_with(new.gambar_url, awalan_karya(auth.uid())) then
      raise exception 'Gambar harus diunggah lewat situs ini';
    end if;
  end if;

  new.pembuat_id := auth.uid();
  new.pembuat_nama := nama_pengguna;
  new.skor := 0;
  new.jumlah_komentar := 0;
  new.dibuat_pada := now();
  new.diperbarui_pada := now();
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."isi_pembuat"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."isi_pembuat"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."isi_pembuat"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."isi_pembuat"() TO "postgres";
