CREATE OR REPLACE FUNCTION public.game_kirim_chat (
  p_isi text,
  p_ke  text DEFAULT NULL::text
)
  RETURNS bigint
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_teks text := btrim(coalesce(p_isi, ''));
  v_pl game_pemain%rowtype;
  v_nama text;
  v_ke uuid := null;
  v_nama_ke text := null;
  v_n integer;
  v_total integer;
  v_id bigint;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  if game_cfg_int('chat_aktif', 1) = 0 then raise exception 'Chat sedang dinonaktifkan'; end if;
  if char_length(v_teks) < 1 or char_length(v_teks) > 300 then
    raise exception 'Pesan harus 1 sampai 300 karakter';
  end if;

  select * into v_pl from game_pemain where id = v_uid;
  if not found then raise exception 'Belum masuk game'; end if;
  if v_pl.bisu_sampai is not null and v_pl.bisu_sampai > now() then
    raise exception 'Kamu sedang dibisukan';
  end if;

  if p_ke is not null and btrim(p_ke) <> '' then
    select p.id, p.username into v_ke, v_nama_ke
      from profil p join game_pemain g on g.id = p.id
      where lower(p.username) = lower(btrim(p_ke));
    if v_ke is null then raise exception 'Pemain @% tidak ditemukan', btrim(p_ke); end if;
    if v_ke = v_uid then raise exception 'Tidak bisa membisik diri sendiri'; end if;
  end if;

  select count(*) into v_n from game_chat
    where penulis_id = v_uid and dibuat_pada > now() - interval '10 seconds';
  if v_n >= 6 then raise exception 'Terlalu cepat mengirim pesan'; end if;

  select username into v_nama from profil where id = v_uid;
  insert into game_chat (penulis_id, penulis_nama, isi, penerima_id, penerima_nama)
    values (v_uid, v_nama, v_teks, v_ke, v_nama_ke)
    returning id into v_id;

  select count(*) into v_total from game_chat;
  if v_total > 350 then
    delete from game_chat where id in (select id from game_chat order by id desc offset 300);
  end if;
  return v_id;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_kirim_chat"(text, text) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_kirim_chat"(text, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_kirim_chat"(text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_kirim_chat"(text, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_kirim_chat"(text, text) FROM PUBLIC, "anon";
