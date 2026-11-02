CREATE OR REPLACE FUNCTION public.game_tambah_poin (
  p_jenis  text,
  p_jumlah integer
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_uid uuid := auth.uid();
  v_pl game_pemain%rowtype;
begin
  if v_uid is null then raise exception 'Harus masuk dulu'; end if;
  if p_jumlah is null or p_jumlah < 1 or p_jumlah > 20 then raise exception 'Jumlah tidak valid'; end if;
  select * into v_pl from game_pemain where id = v_uid for update;
  if not found then raise exception 'Belum masuk game'; end if;
  if v_pl.poin_sisa < p_jumlah then raise exception 'Poin tidak cukup'; end if;

  if p_jenis = 'hp' then
    update game_pemain
      set poin_hp = poin_hp + p_jumlah,
          poin_sisa = poin_sisa - p_jumlah,
          hp = case when mati_sampai is not null and mati_sampai > now() then 0
                    else least(game_hp_maks(poin_hp + p_jumlah),
                               game_hp_efektif(hp, hp_waktu, game_hp_maks(poin_hp)) + p_jumlah * 10) end,
          hp_waktu = now()
      where id = v_uid;
  elsif p_jenis = 'speed' then
    if v_pl.poin_speed + p_jumlah > 7 then raise exception 'Kecepatan serang sudah maksimum'; end if;
    update game_pemain
      set poin_speed = poin_speed + p_jumlah, poin_sisa = poin_sisa - p_jumlah
      where id = v_uid;
  else
    raise exception 'Jenis poin tidak dikenal';
  end if;
  return game_status();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."game_tambah_poin"(text, integer) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."game_tambah_poin"(text, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_tambah_poin"(text, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_tambah_poin"(text, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_tambah_poin"(text, integer) FROM PUBLIC, "anon";
