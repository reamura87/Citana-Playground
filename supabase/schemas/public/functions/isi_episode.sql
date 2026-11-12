CREATE OR REPLACE FUNCTION public.isi_episode()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare jumlah int; n int;
begin
  if auth.uid() is not null and not is_admin() then
    select count(*) into jumlah
      from satua_episode e join satua s on s.id = e.satua_id
      where s.penulis_id = auth.uid() and e.dibuat_pada > now() - interval '1 hour';
    if jumlah >= 20 then
      raise exception 'Terlalu banyak episode dalam satu jam. Coba lagi nanti.';
    end if;
  end if;

  select coalesce(max(nomor), 0) + 1 into n from satua_episode where satua_id = new.satua_id;
  new.nomor := n;
  new.skor := 0;
  new.jumlah_komentar := 0;
  new.dibuat_pada := now();
  new.diperbarui_pada := now();
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."isi_episode"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."isi_episode"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."isi_episode"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."isi_episode"() TO "postgres";
