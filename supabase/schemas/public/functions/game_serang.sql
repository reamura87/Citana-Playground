CREATE OR REPLACE FUNCTION public.game_serang (
  p_spawn integer
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_s game_spawn%rowtype;
  v_m game_musuh%rowtype;
  v_pl game_pemain%rowtype;
  v_k game_kelas%rowtype;
  v_h game_harian%rowtype;
  v_hari date := game_hari_ini();
  v_batas integer := game_cfg_int('batas_pertarungan_harian', 20);
  v_min_persen integer := game_cfg_int('bos_min_persen', 2);
  v_jeda integer;
  v_atk integer;
  v_def integer;
  v_dmg integer;
  v_nyata integer;
  v_hp integer;
  v_mati boolean := false;
  v_berhadiah boolean := false;
  v_xp integer := 0;
  v_gold integer := 0;
  v_naik integer := 0;
  v_sumbangan integer := 0;
  v_total integer;
  v_bagi_xp integer;
  v_bagi_gold integer;
  v_naik_r integer;
  v_balasan jsonb := null;
  r record;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;

  select * into v_s from game_spawn where id = p_spawn for update;
  if not found then raise exception 'Musuh tidak ditemukan'; end if;
  select * into v_m from game_musuh where id = v_s.musuh_id and aktif;
  if not found then raise exception 'Musuh tidak aktif'; end if;
  select * into v_pl from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;

  perform game_segarkan_pemain(v_uid);
  select * into v_pl from game_pemain where id = v_uid;
  if v_pl.mati_sampai is not null and v_pl.mati_sampai > now() then
    raise exception 'Kamu sedang menunggu respawn';
  end if;
  select * into v_k from game_kelas where id = v_pl.kelas;

  v_jeda := greatest(150, 350 + v_k.jeda_tambah_ms - 20 * v_pl.poin_speed);
  if v_pl.terakhir_serang is not null
     and now() - v_pl.terakhir_serang < make_interval(secs => v_jeda / 1000.0) then
    raise exception 'Terlalu cepat';
  end if;

  if v_s.hp = 0 and (v_s.hidup_lagi_pada is null or v_s.hidup_lagi_pada <= now()) then
    update game_spawn
      set hp = v_m.hp, mati_pada = null, hidup_lagi_pada = null,
          siklus = siklus + (case when v_m.jenis = 'bos' then 1 else 0 end)
      where id = v_s.id;
    select * into v_s from game_spawn where id = p_spawn;
  end if;
  if v_s.hp <= 0 then raise exception 'Musuh ini sudah mati'; end if;

  select coalesce(attack, 0) into v_atk from game_item where id = v_pl.senjata_id;
  v_atk := coalesce(v_atk, 0);
  v_dmg := greatest(1,
    floor((4 + v_atk) * v_k.damage_persen / 100.0)::integer + floor(random() * 5)::integer - 2);
  v_nyata := least(v_dmg, v_s.hp);
  v_hp := v_s.hp - v_nyata;
  update game_spawn set hp = v_hp where id = v_s.id;
  update game_pemain set terakhir_serang = now() where id = v_uid;

  if v_m.jenis = 'bos' then
    insert into game_bos_damage (spawn_id, siklus, pemain_id, damage)
      values (v_s.id, v_s.siklus, v_uid, v_nyata)
      on conflict (spawn_id, siklus, pemain_id)
      do update set damage = game_bos_damage.damage + excluded.damage;
    select damage into v_sumbangan from game_bos_damage
      where spawn_id = v_s.id and siklus = v_s.siklus and pemain_id = v_uid;
  end if;

  if v_hp = 0 then
    v_mati := true;
    update game_spawn
      set mati_pada = now(),
          hidup_lagi_pada = now() + make_interval(secs => v_m.respawn_detik)
      where id = v_s.id;

    if v_m.jenis = 'bos' then
      select coalesce(sum(damage), 0) into v_total from game_bos_damage
        where spawn_id = v_s.id and siklus = v_s.siklus
          and damage * 100 >= v_m.hp * v_min_persen;
      if v_total > 0 then
        for r in
          select pemain_id, damage from game_bos_damage
          where spawn_id = v_s.id and siklus = v_s.siklus
            and damage * 100 >= v_m.hp * v_min_persen
        loop
          v_bagi_xp := floor(v_m.xp::numeric * r.damage / v_total)::integer;
          v_bagi_gold := floor(v_m.gold::numeric * r.damage / v_total)::integer;
          v_naik_r := game_beri_hadiah(r.pemain_id, v_bagi_xp, v_bagi_gold);
          if r.pemain_id = v_uid then
            v_xp := v_bagi_xp;
            v_gold := v_bagi_gold;
            v_naik := v_naik_r;
            v_berhadiah := true;
          end if;
        end loop;
      end if;
    else
      -- Kill dihitung untuk misi harian walau jatah hadiah harian sudah habis
      perform game_catat_progres(v_uid, 'bunuh', v_m.id, 1);

      insert into game_harian (pemain_id, tanggal) values (v_uid, v_hari)
        on conflict (pemain_id, tanggal) do nothing;
      select * into v_h from game_harian where pemain_id = v_uid and tanggal = v_hari;
      if v_h.berhadiah < v_batas then
        v_berhadiah := true;
        v_xp := v_m.xp;
        v_gold := v_m.gold;
        v_naik := game_beri_hadiah(v_uid, v_xp, v_gold);
        update game_harian
          set berhadiah = berhadiah + 1,
              xp_didapat = xp_didapat + v_xp,
              gold_didapat = gold_didapat + v_gold
          where pemain_id = v_uid and tanggal = v_hari;
      end if;
    end if;
  elsif v_m.jenis = 'bos' and random() < 0.5 then
    -- Naga membalas di sisi server (pengaman agar naga tidak bisa dilawan tanpa risiko)
    select coalesce(defense, 0) into v_def from game_item where id = v_pl.armor_id;
    v_def := coalesce(v_def, 0) + v_k.def_bonus;
    v_dmg := greatest(1, floor(
      (floor(v_m.serangan * 0.8)::integer - v_def + floor(random() * 3)::integer - 1)
      * v_k.diterima_persen / 100.0)::integer);
    v_balasan := game_lukai(v_uid, v_dmg);
  end if;

  return jsonb_build_object(
    'hasil', jsonb_build_object(
      'damage', v_nyata, 'hp', v_hp, 'hp_maks', v_m.hp, 'mati', v_mati,
      'jenis', v_m.jenis, 'nama', v_m.nama, 'berhadiah', v_berhadiah,
      'xp', v_xp, 'gold', v_gold, 'level_naik', v_naik, 'sumbangan', v_sumbangan),
    'balasan', v_balasan,
    'spawn', game_spawn_json(v_s.id),
    'status', game_status());
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_serang"(integer) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_serang"(integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_serang"(integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_serang"(integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_serang"(integer) FROM PUBLIC, "anon";
