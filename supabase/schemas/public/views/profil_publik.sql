CREATE VIEW "public"."profil_publik" AS  SELECT id,
    username,
    avatar_url
   FROM public.profil;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profil_publik" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profil_publik" TO "service_role";

REVOKE ALL ON TABLE "public"."profil_publik" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profil_publik" TO "postgres";
