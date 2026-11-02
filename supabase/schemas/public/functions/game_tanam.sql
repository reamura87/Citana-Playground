CREATE OR REPLACE FUNCTION public.game_tanam (
  p_indeks  integer,
  p_tanaman text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_petak integer;
  v_t game_tanaman%rowtype;
  v_n integer;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  perform 1 from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;

  select rl.jumlah_petak into v_petak
    from game_rumah r join game_rumah_level rl on rl.level = r.level
    where r.pemain_id = v_uid;
  if p_indeks is null or p_indeks < 0 or p_indeks >= v_petak then
    raise exception 'Petak tidak valid';
  end if;

  select * into v_t from game_tanaman where id = p_tanaman and aktif;
  if not found then raise exception 'Tanaman tidak tersedia'; end if;

  if exists (select 1 from game_petak where pemain_id = v_uid and indeks = p_indeks) then
    raise exception 'Petak sudah terisi';
  end if;

  update game_inventaris set jumlah = jumlah - 1
    where pemain_id = v_uid and item_id = v_t.bibit_item and jumlah >= 1;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Kamu tidak punya bibit ini'; end if;

  insert into game_petak (pemain_id, indeks, tanaman_id, ditanam_pada, siap_pada)
    values (v_uid, p_indeks, v_t.id, now(), now() + make_interval(secs => v_t.durasi_detik));
  return game_status();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_tanam"(integer, text) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_tanam"(integer, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_tanam"(integer, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_tanam"(integer, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_tanam"(integer, text) FROM PUBLIC, "anon";
