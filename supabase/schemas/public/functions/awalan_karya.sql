CREATE OR REPLACE FUNCTION public.awalan_karya (
  u uuid
)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  AS $function$
  select 'https://aedgrgqmeijaljoperzv.supabase.co/storage/v1/object/public/karya/' || u::text || '/'
$function$;

GRANT EXECUTE ON FUNCTION "public"."awalan_karya"(uuid) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."awalan_karya"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."awalan_karya"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."awalan_karya"(uuid) TO "postgres";
