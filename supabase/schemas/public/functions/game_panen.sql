CREATE OR REPLACE FUNCTION public.game_panen (
  p_indeks integer
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_p game_petak%rowtype;
  v_t game_tanaman%rowtype;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  perform 1 from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;

  select * into v_p from game_petak where pemain_id = v_uid and indeks = p_indeks;
  if not found then raise exception 'Tidak ada tanaman di petak ini'; end if;
  if v_p.siap_pada > now() then raise exception 'Tanaman belum siap dipanen'; end if;

  select * into v_t from game_tanaman where id = v_p.tanaman_id;
  delete from game_petak where pemain_id = v_uid and indeks = p_indeks;
  insert into game_inventaris (pemain_id, item_id, jumlah)
    values (v_uid, v_t.hasil_item, v_t.hasil_jumlah)
    on conflict (pemain_id, item_id)
    do update set jumlah = game_inventaris.jumlah + excluded.jumlah;
  return game_status();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_panen"(integer) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_panen"(integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_panen"(integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_panen"(integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_panen"(integer) FROM PUBLIC, "anon";
