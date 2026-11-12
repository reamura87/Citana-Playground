CREATE OR REPLACE FUNCTION public.game_buat_karakter (
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
  v_kustom jsonb;
  v_pl game_pemain%rowtype;
  v_ada boolean;
  v_n integer;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  if not exists (select 1 from profil where id = v_uid) then
    raise exception 'Akun belum punya username';
  end if;
  select * into v_k from game_kelas where id = p_kelas;
  if not found then raise exception 'Role tidak dikenal'; end if;
  v_kustom := game_valid_kustom(p_kustom);

  select * into v_pl from game_pemain where id = v_uid for update;
  v_ada := found;
  if v_ada and v_pl.karakter_dibuat then
    raise exception 'Karakter sudah dibuat. Role tidak bisa diganti.';
  end if;

  if not v_ada then
    insert into game_pemain (id, gold, senjata_id, armor_id, kelas, kustom, karakter_dibuat)
      values (v_uid, 50, v_k.senjata_awal, 'pakaian_desa', p_kelas, v_kustom, true)
      on conflict (id) do nothing;
    get diagnostics v_n = row_count;
    if v_n = 0 then raise exception 'Karakter sudah dibuat. Role tidak bisa diganti.'; end if;
    insert into game_rumah (pemain_id, level) values (v_uid, 1) on conflict do nothing;
    insert into game_inventaris (pemain_id, item_id, jumlah) values
      (v_uid, 'bibit_wortel', 4), (v_uid, v_k.senjata_awal, 1), (v_uid, 'pakaian_desa', 1)
      on conflict do nothing;
  else
    -- Pemain lama: memilih role dan penampilan satu kali, progres dipertahankan
    insert into game_inventaris (pemain_id, item_id, jumlah) values (v_uid, v_k.senjata_awal, 1)
      on conflict (pemain_id, item_id)
      do update set jumlah = greatest(game_inventaris.jumlah, 1);
    update game_pemain
      set kelas = p_kelas, kustom = v_kustom, karakter_dibuat = true,
          senjata_id = game_senjata_terbaik(v_uid, p_kelas)
      where id = v_uid;
  end if;
  return game_status();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_buat_karakter"(text, jsonb) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_buat_karakter"(text, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_buat_karakter"(text, jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_buat_karakter"(text, jsonb) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_buat_karakter"(text, jsonb) FROM PUBLIC, "anon";
