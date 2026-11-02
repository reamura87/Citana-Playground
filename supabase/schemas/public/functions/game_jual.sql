CREATE OR REPLACE FUNCTION public.game_jual (
  p_item   text,
  p_jumlah integer
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_item game_item%rowtype;
  v_n integer;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  if p_jumlah is null or p_jumlah < 1 or p_jumlah > 999 then raise exception 'Jumlah tidak valid'; end if;
  perform 1 from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;

  select * into v_item from game_item where id = p_item and aktif and harga_jual is not null;
  if not found then raise exception 'Item tidak bisa dijual'; end if;

  if exists (select 1 from game_pemain where id = v_uid and (senjata_id = p_item or armor_id = p_item)) then
    raise exception 'Pakai perlengkapan lain dulu sebelum menjual yang ini';
  end if;

  update game_inventaris set jumlah = jumlah - p_jumlah
    where pemain_id = v_uid and item_id = p_item and jumlah >= p_jumlah;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Jumlah item tidak cukup'; end if;

  update game_pemain set gold = gold + v_item.harga_jual * p_jumlah, diperbarui_pada = now()
    where id = v_uid;
  return game_status();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_jual"(text, integer) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_jual"(text, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_jual"(text, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_jual"(text, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_jual"(text, integer) FROM PUBLIC, "anon";
