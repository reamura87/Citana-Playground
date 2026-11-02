CREATE OR REPLACE FUNCTION public.game_catat_progres (
  p_pemain uuid,
  p_jenis  text,
  p_target text,
  p_jumlah integer
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  update game_quest_pemain q
    set progres = least(g.jumlah, q.progres + p_jumlah)
  from game_quest g
  where q.quest_id = g.id and q.pemain_id = p_pemain and q.tanggal = game_hari_ini()
    and q.status = 'aktif' and q.progres < g.jumlah
    and g.jenis = p_jenis and (g.target = p_target or g.target = '*')
$function$;

GRANT EXECUTE ON FUNCTION "public"."game_catat_progres"(uuid, text, text, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."game_catat_progres"(uuid, text, text, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."game_catat_progres"(uuid, text, text, integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."game_catat_progres"(uuid, text, text, integer) FROM PUBLIC, "anon", "authenticated";
