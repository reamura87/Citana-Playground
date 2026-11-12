CREATE OR REPLACE FUNCTION public.game_quest_klaim (
  p_quest text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_hari date := game_hari_ini();
  v_g game_quest%rowtype;
  v_q game_quest_pemain%rowtype;
  v_naik integer;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  perform 1 from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;

  select * into v_q from game_quest_pemain
    where pemain_id = v_uid and tanggal = v_hari and quest_id = p_quest for update;
  if not found then raise exception 'Itu bukan misimu hari ini'; end if;
  select * into v_g from game_quest where id = p_quest;
  if v_q.status = 'diambil' then raise exception 'Hadiah misi ini sudah diambil'; end if;
  if v_q.progres < v_g.jumlah then
    raise exception 'Misi belum selesai (% dari %)', v_q.progres, v_g.jumlah;
  end if;

  update game_quest_pemain set status = 'diambil'
    where pemain_id = v_uid and tanggal = v_hari and quest_id = p_quest;
  v_naik := game_beri_hadiah(v_uid, v_g.xp, v_g.gold);

  return jsonb_build_object(
    'judul', v_g.judul, 'xp', v_g.xp, 'gold', v_g.gold, 'level_naik', v_naik,
    'misi', game_quest_hari_ini(), 'status', game_status());
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_quest_klaim"(text) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_quest_klaim"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_quest_klaim"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_quest_klaim"(text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_quest_klaim"(text) FROM PUBLIC, "anon";
