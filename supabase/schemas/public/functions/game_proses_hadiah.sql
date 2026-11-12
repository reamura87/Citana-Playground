CREATE OR REPLACE FUNCTION public.game_proses_hadiah (
  p_id   bigint,
  p_aksi text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_h game_hadiah%rowtype;
  v_item game_item%rowtype;
  v_nama text;
  v_nama_lain text;
  v_ke uuid;
  v_pesan text;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  if p_aksi not in ('ambil', 'tolak', 'batal') then raise exception 'Aksi tidak dikenal'; end if;
  perform 1 from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;

  select * into v_h from game_hadiah where id = p_id for update;
  if not found or (v_h.penerima_id <> v_uid and v_h.pengirim_id <> v_uid) then
    raise exception 'Hadiah tidak ditemukan';
  end if;
  if p_aksi in ('ambil', 'tolak') and v_h.penerima_id <> v_uid then
    raise exception 'Hanya penerima yang bisa memproses hadiah ini';
  end if;
  if p_aksi = 'batal' and v_h.pengirim_id <> v_uid then
    raise exception 'Hanya pengirim yang bisa membatalkan';
  end if;

  if v_h.status <> 'menunggu' then
    return jsonb_build_object('ok', false, 'pesan', 'Hadiah ini sudah selesai diproses.', 'status', game_status());
  end if;
  if v_h.kadaluarsa_pada <= now() then
    perform game_kembalikan_hadiah(v_uid);
    return jsonb_build_object('ok', false,
      'pesan', 'Hadiah sudah kedaluwarsa dan dikembalikan ke pengirim.', 'status', game_status());
  end if;

  select * into v_item from game_item where id = v_h.item_id;
  select username into v_nama from profil where id = v_uid;

  if p_aksi = 'ambil' then
    if v_item.kategori in ('senjata', 'armor') and exists (
         select 1 from game_inventaris
         where pemain_id = v_uid and item_id = v_h.item_id and jumlah >= 1) then
      return jsonb_build_object('ok', false,
        'pesan', 'Kamu sudah memiliki ' || v_item.nama || '. Tolak hadiah ini agar dikembalikan.',
        'status', game_status());
    end if;
    insert into game_inventaris (pemain_id, item_id, jumlah) values (v_uid, v_h.item_id, v_h.jumlah)
      on conflict (pemain_id, item_id)
      do update set jumlah = game_inventaris.jumlah + excluded.jumlah;
    update game_hadiah set status = 'diambil', selesai_pada = now() where id = p_id;
    v_ke := v_h.pengirim_id;
    v_pesan := 'mengambil hadiahmu: ' || v_h.jumlah || 'x ' || v_item.nama;
  else
    insert into game_inventaris (pemain_id, item_id, jumlah)
      values (v_h.pengirim_id, v_h.item_id, v_h.jumlah)
      on conflict (pemain_id, item_id)
      do update set jumlah = game_inventaris.jumlah + excluded.jumlah;
    if p_aksi = 'tolak' then
      update game_hadiah set status = 'ditolak', selesai_pada = now() where id = p_id;
      v_ke := v_h.pengirim_id;
      v_pesan := 'menolak hadiahmu: ' || v_h.jumlah || 'x ' || v_item.nama || ' (dikembalikan)';
    else
      update game_hadiah set status = 'dibatalkan', selesai_pada = now() where id = p_id;
      v_ke := v_h.penerima_id;
      v_pesan := 'membatalkan hadiah untukmu: ' || v_h.jumlah || 'x ' || v_item.nama;
    end if;
  end if;

  select username into v_nama_lain from profil where id = v_ke;
  insert into game_chat (penulis_id, penulis_nama, isi, penerima_id, penerima_nama, jenis, hadiah_id)
    values (v_uid, v_nama, v_pesan, v_ke, v_nama_lain, 'sistem', p_id);

  return jsonb_build_object('ok', true, 'pesan', v_pesan, 'status', game_status());
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_proses_hadiah"(bigint, text) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_proses_hadiah"(bigint, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_proses_hadiah"(bigint, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_proses_hadiah"(bigint, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_proses_hadiah"(bigint, text) FROM PUBLIC, "anon";
