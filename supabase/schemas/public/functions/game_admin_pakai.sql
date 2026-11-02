CREATE OR REPLACE FUNCTION public.game_admin_pakai (
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
begin
  if not is_admin() then raise exception 'Hanya admin'; end if;
  perform 1 from game_pemain where id = v_uid for update;
  if not found then raise exception 'Buat karakter dulu'; end if;
  select * into v_item from game_item where id = p_item and aktif;
  if not found then raise exception 'Item tidak ditemukan'; end if;
  if v_item.kategori not in ('senjata', 'armor') then raise exception 'Hanya senjata dan armor'; end if;

  insert into game_inventaris (pemain_id, item_id, jumlah) values (v_uid, p_item, 1)
    on conflict (pemain_id, item_id)
    do update set jumlah = greatest(game_inventaris.jumlah, 1);
  if v_item.kategori = 'senjata' then
    update game_pemain set senjata_id = p_item where id = v_uid;
  else
    update game_pemain set armor_id = p_item where id = v_uid;
  end if;
  return game_status();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_admin_pakai"(text) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_admin_pakai"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_admin_pakai"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_admin_pakai"(text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_admin_pakai"(text) FROM PUBLIC, "anon";
