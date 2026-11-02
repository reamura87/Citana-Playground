CREATE OR REPLACE FUNCTION public.buat_profil()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare nama text := lower(trim(coalesce(new.raw_user_meta_data->>'username', '')));
begin
  if nama !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'Username harus 3-20 karakter: huruf kecil, angka, atau garis bawah';
  end if;
  if nama ~ '(slot|togel|judi|judol|gacor|sbobet|maxwin)' then
    raise exception 'Username tidak diizinkan';
  end if;
  insert into profil (id, username) values (new.id, nama);
  return new;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."buat_profil"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."buat_profil"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."buat_profil"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."buat_profil"() TO "postgres";
