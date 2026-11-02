CREATE OR REPLACE FUNCTION public.game_beli (
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
  v_alat game_alat%rowtype;
  v_pl game_pemain%rowtype;
  v_stat integer;
  v_sebelum text;
  v_total integer;
  v_n integer;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  if p_jumlah is null or p_jumlah < 1 or p_jumlah > 99 then raise exception 'Jumlah tidak valid'; end if;
  select * into v_pl from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;

  select * into v_item from game_item where id = p_item and aktif and harga_beli is not null;
  if not found then raise exception 'Item tidak dijual'; end if;

  if v_item.kelas is not null and v_item.kelas <> v_pl.kelas then
    raise exception 'Senjata ini hanya untuk kelas %', (select nama from game_kelas where id = v_item.kelas);
  end if;

  if v_item.kategori in ('senjata', 'armor', 'alat') then
    if p_jumlah <> 1 then raise exception 'Perlengkapan dibeli satu per satu'; end if;
    if exists (select 1 from game_inventaris
               where pemain_id = v_uid and item_id = v_item.id and jumlah >= 1) then
      raise exception 'Kamu sudah memilikinya';
    end if;
  end if;

  if v_item.kategori = 'alat' then
    select * into v_alat from game_alat where item_id = v_item.id;
    if v_pl.level < v_alat.syarat_level then
      raise exception 'Butuh level % untuk membeli ini', v_alat.syarat_level;
    end if;
    if v_alat.tier > 1 then
      select i.nama into v_sebelum
        from game_alat a join game_item i on i.id = a.item_id
        where a.jenis = v_alat.jenis and a.tier = v_alat.tier - 1;
      if not exists (
        select 1 from game_inventaris gi join game_alat a on a.item_id = gi.item_id
        where gi.pemain_id = v_uid and gi.jumlah >= 1
          and a.jenis = v_alat.jenis and a.tier = v_alat.tier - 1) then
        raise exception 'Beli % lebih dulu', v_sebelum;
      end if;
    end if;
    v_stat := case when v_alat.jenis = 'beliung' then v_pl.tambang_total else v_pl.tumbuhan_total end;
    if v_stat < v_alat.syarat_jumlah then
      raise exception 'Kamu baru % dari % kali % yang dibutuhkan',
        v_stat, v_alat.syarat_jumlah,
        case when v_alat.jenis = 'beliung' then 'menambang' else 'mengumpulkan tumbuhan' end;
    end if;
  end if;

  v_total := v_item.harga_beli * p_jumlah;
  update game_pemain set gold = gold - v_total, diperbarui_pada = now()
    where id = v_uid and gold >= v_total;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Gold tidak cukup'; end if;

  insert into game_inventaris (pemain_id, item_id, jumlah) values (v_uid, v_item.id, p_jumlah)
    on conflict (pemain_id, item_id)
    do update set jumlah = game_inventaris.jumlah + excluded.jumlah;
  return game_status();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_beli"(text, integer) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_beli"(text, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_beli"(text, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_beli"(text, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_beli"(text, integer) FROM PUBLIC, "anon";
