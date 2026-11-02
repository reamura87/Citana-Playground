CREATE OR REPLACE FUNCTION public.game_kirim_hadiah (
  p_penerima uuid,
  p_item     text,
  p_jumlah   integer
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_pl game_pemain%rowtype;
  v_item game_item%rowtype;
  v_nama text;
  v_nama_ke text;
  v_n integer;
  v_id bigint;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  if p_penerima is null or p_penerima = v_uid then raise exception 'Pilih pemain lain sebagai penerima'; end if;
  if p_jumlah is null or p_jumlah < 1 or p_jumlah > 99 then raise exception 'Jumlah tidak valid'; end if;

  select * into v_pl from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;
  if v_pl.bisu_sampai is not null and v_pl.bisu_sampai > now() then
    raise exception 'Kamu sedang dibisukan';
  end if;
  select username into v_nama_ke from profil p join game_pemain g on g.id = p.id where p.id = p_penerima;
  if v_nama_ke is null then raise exception 'Penerima belum bermain'; end if;

  perform game_kembalikan_hadiah(v_uid);

  select * into v_item from game_item where id = p_item and aktif;
  if not found then raise exception 'Item tidak ditemukan'; end if;
  if v_item.kategori not in ('bibit', 'panen', 'ramuan', 'senjata', 'armor', 'tumbuhan', 'ore') then
    raise exception 'Item ini tidak bisa dihadiahkan';
  end if;
  if v_pl.senjata_id = p_item or v_pl.armor_id = p_item then
    raise exception 'Lepaskan item yang sedang dipakai dulu';
  end if;
  if v_item.kategori in ('senjata', 'armor') and p_jumlah <> 1 then
    raise exception 'Perlengkapan dihadiahkan satu per satu';
  end if;

  select count(*) into v_n from game_hadiah where pengirim_id = v_uid and status = 'menunggu';
  if v_n >= 5 then raise exception 'Terlalu banyak hadiah yang belum diambil'; end if;
  if exists (select 1 from game_hadiah
             where pengirim_id = v_uid and dibuat_pada > now() - interval '5 seconds') then
    raise exception 'Terlalu cepat';
  end if;

  update game_inventaris set jumlah = jumlah - p_jumlah
    where pemain_id = v_uid and item_id = p_item and jumlah >= p_jumlah;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Jumlah item tidak cukup'; end if;

  insert into game_hadiah (pengirim_id, penerima_id, item_id, jumlah)
    values (v_uid, p_penerima, p_item, p_jumlah) returning id into v_id;

  select username into v_nama from profil where id = v_uid;
  insert into game_chat (penulis_id, penulis_nama, isi, penerima_id, penerima_nama, jenis, hadiah_id)
    values (v_uid, v_nama, 'mengirim hadiah: ' || p_jumlah || 'x ' || v_item.nama,
            p_penerima, v_nama_ke, 'hadiah', v_id);

  return jsonb_build_object('hadiah_id', v_id, 'status', game_status());
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_kirim_hadiah"(uuid, text, integer) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_kirim_hadiah"(uuid, text, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_kirim_hadiah"(uuid, text, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_kirim_hadiah"(uuid, text, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_kirim_hadiah"(uuid, text, integer) FROM PUBLIC, "anon";
