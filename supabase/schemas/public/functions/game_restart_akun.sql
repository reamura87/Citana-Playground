CREATE OR REPLACE FUNCTION public.game_restart_akun (
  p_konfirmasi text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_nama text;
  v_n integer;
  r record;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  select username into v_nama from profil where id = v_uid;
  if v_nama is null then raise exception 'Akun belum punya username'; end if;
  if p_konfirmasi is distinct from v_nama then
    raise exception 'Username yang diketik tidak cocok';
  end if;

  select count(*) into v_n from game_restart_log
    where pengguna_id = v_uid and waktu > now() - interval '24 hours';
  if v_n >= 3 then raise exception 'Batas restart akun game tercapai (3 kali per 24 jam)'; end if;

  perform 1 from game_pemain where id = v_uid for update;
  if not found then raise exception 'Kamu belum memiliki akun game'; end if;

  -- Hadiah yang menunggu kamu ambil dikembalikan ke pengirimnya
  for r in
    select * from game_hadiah where penerima_id = v_uid and status = 'menunggu' for update
  loop
    update game_hadiah set status = 'dibatalkan', selesai_pada = now() where id = r.id;
    insert into game_inventaris (pemain_id, item_id, jumlah)
      values (r.pengirim_id, r.item_id, r.jumlah)
      on conflict (pemain_id, item_id)
      do update set jumlah = game_inventaris.jumlah + excluded.jumlah;
  end loop;

  -- Seluruh data game ikut terhapus (cascade): inventaris, rumah, kebun, misi, dan seterusnya
  delete from game_pemain where id = v_uid;
  insert into game_restart_log (pengguna_id) values (v_uid);
  return jsonb_build_object('ok', true);
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_restart_akun"(text) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_restart_akun"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_restart_akun"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_restart_akun"(text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_restart_akun"(text) FROM PUBLIC, "anon";
