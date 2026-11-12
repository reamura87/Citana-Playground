CREATE OR REPLACE FUNCTION public.game_status()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_hasil jsonb;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;

  select jsonb_build_object(
    'pemain', jsonb_build_object(
      'nama', (select username from profil where id = v_uid),
      'level', p.level, 'xp', p.xp, 'xp_butuh', game_xp_butuh(p.level), 'gold', p.gold,
      'hp_maks', game_hp_maks(p.poin_hp),
      'hp', case
        when p.mati_sampai is not null and p.mati_sampai > now() then 0
        when p.mati_sampai is not null then game_hp_maks(p.poin_hp)
        else game_hp_efektif(p.hp, p.hp_waktu, game_hp_maks(p.poin_hp)) end,
      'mati_sampai', case when p.mati_sampai > now() then p.mati_sampai else null end,
      'poin_sisa', p.poin_sisa, 'poin_hp', p.poin_hp, 'poin_speed', p.poin_speed,
      'kelas', jsonb_build_object(
        'id', k.id, 'nama', k.nama, 'deskripsi', k.deskripsi, 'jangkauan', k.jangkauan),
      'kustom', p.kustom,
      'senjata', jsonb_build_object('id', p.senjata_id, 'nama', w.nama, 'attack', coalesce(w.attack, 0)),
      'armor', jsonb_build_object('id', p.armor_id, 'nama', a.nama, 'defense', coalesce(a.defense, 0)),
      'attack', floor((4 + coalesce(w.attack, 0)) * k.damage_persen / 100.0)::integer,
      'defense', coalesce(a.defense, 0) + k.def_bonus,
      'jeda_serang_ms', 420 + k.jeda_tambah_ms - 20 * p.poin_speed),
    'rumah', jsonb_build_object(
      'level', r.level,
      'jumlah_petak', rl.jumlah_petak,
      'berikutnya', (select jsonb_build_object(
          'level', n.level, 'biaya_gold', n.biaya_gold, 'jumlah_petak', n.jumlah_petak)
        from game_rumah_level n where n.level = r.level + 1)),
    'petak', coalesce((select jsonb_agg(jsonb_build_object(
          'indeks', indeks, 'tanaman_id', tanaman_id,
          'ditanam_pada', ditanam_pada, 'siap_pada', siap_pada) order by indeks)
        from game_petak where pemain_id = v_uid), '[]'::jsonb),
    'inventaris', coalesce((select jsonb_agg(jsonb_build_object(
          'item_id', item_id, 'jumlah', jumlah) order by item_id)
        from game_inventaris where pemain_id = v_uid and jumlah > 0), '[]'::jsonb),
    'harian', jsonb_build_object(
      'batas', game_cfg_int('batas_pertarungan_harian', 20),
      'berhadiah', coalesce(h.berhadiah, 0),
      'reset_pada', game_reset_berikut()),
    'waktu_server', now()
  ) into v_hasil
  from game_pemain p
  join game_kelas k on k.id = p.kelas
  join game_rumah r on r.pemain_id = p.id
  join game_rumah_level rl on rl.level = r.level
  left join game_item w on w.id = p.senjata_id
  left join game_item a on a.id = p.armor_id
  left join game_harian h on h.pemain_id = p.id and h.tanggal = game_hari_ini()
  where p.id = v_uid;

  if v_hasil is null then raise exception 'Belum masuk game'; end if;
  return v_hasil;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_status"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_status"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_status"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_status"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_status"() FROM PUBLIC, "anon";
