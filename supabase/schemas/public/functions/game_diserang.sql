CREATE OR REPLACE FUNCTION public.game_diserang (
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
  v_def integer;
  v_dmg integer;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  select * into v_pl from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;

  perform game_segarkan_pemain(v_uid);
  select * into v_pl from game_pemain where id = v_uid;
  if v_pl.mati_sampai is not null and v_pl.mati_sampai > now() then
    raise exception 'Kamu sedang menunggu respawn';
  end if;
  if v_pl.terakhir_terluka is not null
     and now() - v_pl.terakhir_terluka < interval '500 milliseconds' then
    raise exception 'Terlalu cepat';
  end if;

  select * into v_s from game_spawn where id = p_spawn;
  if not found then raise exception 'Musuh tidak ditemukan'; end if;
  select * into v_m from game_musuh where id = v_s.musuh_id and aktif;
  if not found then raise exception 'Musuh tidak aktif'; end if;
  if v_s.hp = 0 and v_s.hidup_lagi_pada is not null and v_s.hidup_lagi_pada > now() then
    raise exception 'Musuh ini sudah mati';
  end if;

  select * into v_k from game_kelas where id = v_pl.kelas;
  select coalesce(defense, 0) into v_def from game_item where id = v_pl.armor_id;
  v_def := coalesce(v_def, 0) + v_k.def_bonus;
  v_dmg := greatest(1, floor(
    (v_m.serangan - v_def + floor(random() * 3)::integer - 1) * v_k.diterima_persen / 100.0)::integer);

  return jsonb_build_object('hasil', game_lukai(v_uid, v_dmg), 'status', game_status());
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_diserang"(integer) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_diserang"(integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_diserang"(integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_diserang"(integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_diserang"(integer) FROM PUBLIC, "anon";
