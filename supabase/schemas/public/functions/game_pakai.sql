CREATE OR REPLACE FUNCTION public.game_pakai (
  p_item text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_item game_item%rowtype;
  v_pl game_pemain%rowtype;
  v_maks integer;
  v_hp integer;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  select * into v_pl from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;

  select * into v_item from game_item where id = p_item and aktif;
  if not found then raise exception 'Item tidak ditemukan'; end if;
  if not exists (select 1 from game_inventaris
                 where pemain_id = v_uid and item_id = p_item and jumlah >= 1) then
    raise exception 'Kamu tidak punya item ini';
  end if;

  if v_item.kategori = 'senjata' then
    if v_item.kelas is not null and v_item.kelas <> v_pl.kelas then
      raise exception 'Senjata ini untuk kelas %', (select nama from game_kelas where id = v_item.kelas);
    end if;
    update game_pemain set senjata_id = p_item where id = v_uid;
  elsif v_item.kategori = 'armor' then
    update game_pemain set armor_id = p_item where id = v_uid;
  elsif v_item.kategori = 'ramuan' then
    perform game_segarkan_pemain(v_uid);
    select * into v_pl from game_pemain where id = v_uid;
    if v_pl.mati_sampai is not null and v_pl.mati_sampai > now() then
      raise exception 'Tidak bisa memakai ramuan saat gugur';
    end if;
    v_maks := game_hp_maks(v_pl.poin_hp);
    v_hp := game_hp_efektif(v_pl.hp, v_pl.hp_waktu, v_maks);
    if v_hp >= v_maks then raise exception 'HP sudah penuh'; end if;
    update game_inventaris set jumlah = jumlah - 1
      where pemain_id = v_uid and item_id = p_item and jumlah >= 1;
    update game_pemain
      set hp = least(v_maks, v_hp + coalesce(v_item.pulih, 0)), hp_waktu = now()
      where id = v_uid;
  else
    raise exception 'Item ini tidak bisa dipakai';
  end if;
  return game_status();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_pakai"(text) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_pakai"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_pakai"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_pakai"(text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_pakai"(text) FROM PUBLIC, "anon";
