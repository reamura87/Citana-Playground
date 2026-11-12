CREATE OR REPLACE FUNCTION public.game_kembalikan_hadiah (
  p_uid uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  r record;
begin
  for r in
    select * from game_hadiah
    where status = 'menunggu' and kadaluarsa_pada <= now()
      and (pengirim_id = p_uid or penerima_id = p_uid)
    for update skip locked
  loop
    update game_hadiah set status = 'kedaluwarsa', selesai_pada = now() where id = r.id;
    insert into game_inventaris (pemain_id, item_id, jumlah)
      values (r.pengirim_id, r.item_id, r.jumlah)
      on conflict (pemain_id, item_id)
      do update set jumlah = game_inventaris.jumlah + excluded.jumlah;
  end loop;
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_kembalikan_hadiah"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_kembalikan_hadiah"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_kembalikan_hadiah"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_kembalikan_hadiah"(uuid) FROM PUBLIC, "anon", "authenticated";
