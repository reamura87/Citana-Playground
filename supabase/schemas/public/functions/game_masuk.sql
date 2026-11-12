CREATE OR REPLACE FUNCTION public.game_masuk()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_pl game_pemain%rowtype;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  if not exists (select 1 from profil where id = v_uid) then
    raise exception 'Akun belum punya username';
  end if;

  select * into v_pl from game_pemain where id = v_uid;
  if not found then
    return jsonb_build_object('perlu_karakter', true, 'baru', true,
      'nama', (select username from profil where id = v_uid));
  end if;
  if not v_pl.karakter_dibuat then
    return game_status() || jsonb_build_object('perlu_karakter', true, 'baru', false);
  end if;
  return game_status();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_masuk"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_masuk"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_masuk"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_masuk"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_masuk"() FROM PUBLIC, "anon";
