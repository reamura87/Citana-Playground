CREATE TABLE "public"."profil" (
  "id"         uuid NOT NULL,
  "username"   text NOT NULL,
  "peran"      text NOT NULL DEFAULT 'anggota'::text,
  "avatar_url" text,
  CONSTRAINT "profil_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "profil_peran_check" CHECK ((peran = ANY (ARRAY['admin'::text, 'anggota'::text]))),
  CONSTRAINT "profil_pkey" PRIMARY KEY (id),
  CONSTRAINT "profil_username_key" UNIQUE (username)
);

ALTER TABLE "public"."profil"
  ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX profil_username_unik ON public.profil USING btree (lower(username));

CREATE POLICY "baca profil sendiri" ON "public"."profil"
  FOR SELECT
  TO "authenticated"
  USING ((id = auth.uid()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profil" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profil" TO "service_role";

REVOKE ALL ON TABLE "public"."profil" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profil" TO "postgres";
