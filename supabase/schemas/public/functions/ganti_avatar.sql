CREATE OR REPLACE FUNCTION public.ganti_avatar (
  p_url text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare basis text := 'https://aedgrgqmeijaljoperzv.supabase.co';
begin
  if auth.uid() is null then
    raise exception 'Harus masuk dulu';
  end if;
  if p_url is not null and not starts_with(
       p_url, basis || '/storage/v1/object/public/avatar/' || auth.uid()::text || '/') then
    raise exception 'Alamat foto tidak valid';
  end if;
  update profil set avatar_url = p_url where id = auth.uid();
end $function$;

GRANT EXECUTE ON FUNCTION "public"."ganti_avatar"(text) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."ganti_avatar"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."ganti_avatar"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."ganti_avatar"(text) TO "postgres";
