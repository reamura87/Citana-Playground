CREATE OR REPLACE FUNCTION public.game_admin_atur_karakter (
  p_kelas  text,
  p_kustom jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_k game_kelas%rowtype;
  v_pl game_pemain%rowtype;
  v_senjata text;
begin
  if not is_admin() then raise exception 'Hanya admin'; end if;
  select * into v_k from game_kelas where id = p_kelas;
  if not found then raise exception 'Role tidak dikenal'; end if;
  select * into v_pl from game_pemain where id = v_uid for update;
  if not found then raise exception 'Buat karakter dulu'; end if;

  v_senjata := v_pl.senjata_id;
  if v_pl.kelas <> p_kelas then
    insert into game_inventaris (pemain_id, item_id, jumlah) values (v_uid, v_k.senjata_awal, 1)
      on conflict (pemain_id, item_id)
      do update set jumlah = greatest(game_inventaris.jumlah, 1);
    v_senjata := game_senjata_terbaik(v_uid, p_kelas);
  end if;

  update game_pemain
    set kelas = p_kelas, kustom = game_valid_kustom(p_kustom),
        karakter_dibuat = true, senjata_id = v_senjata
    where id = v_uid;
  return game_status();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_admin_atur_karakter"(text, jsonb) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_admin_atur_karakter"(text, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_admin_atur_karakter"(text, jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_admin_atur_karakter"(text, jsonb) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_admin_atur_karakter"(text, jsonb) FROM PUBLIC, "anon";
