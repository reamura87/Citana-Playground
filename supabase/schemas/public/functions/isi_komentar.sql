CREATE OR REPLACE FUNCTION public.isi_komentar()
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
    select count(*) into jumlah from komentar_satua
      where penulis_id = auth.uid() and dibuat_pada > now() - interval '1 hour';
    if jumlah >= 30 then
      raise exception 'Terlalu banyak komentar. Coba lagi nanti.';
    end if;
  end if;

  new.penulis_id := auth.uid();
  new.penulis_nama := nama;
  new.dibuat_pada := now();
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."isi_komentar"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."isi_komentar"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."isi_komentar"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."isi_komentar"() TO "postgres";
