CREATE TABLE "public"."suara_post" (
  "post_id"     uuid     NOT NULL,
  "nilai"       smallint NOT NULL,
  CONSTRAINT "suara_post_nilai_check" CHECK ((nilai = ANY (ARRAY[1, '-1'::integer]))),
  CONSTRAINT "suara_post_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.forum_post(id) ON DELETE CASCADE,
  "pengguna_id" uuid     NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "suara_post_pengguna_id_fkey" FOREIGN KEY (pengguna_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "suara_post_pkey" PRIMARY KEY (post_id, pengguna_id)
);

ALTER TABLE "public"."suara_post"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER suara_post_skor
  AFTER INSERT OR DELETE OR UPDATE ON public.suara_post
  FOR EACH ROW
  EXECUTE FUNCTION public.skor_post();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_post" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_post" TO "service_role";

CREATE POLICY "baca suara sendiri" ON "public"."suara_post"
  FOR SELECT
  TO "authenticated"
  USING ((pengguna_id = auth.uid()));

CREATE POLICY "beri suara" ON "public"."suara_post"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((pengguna_id = auth.uid()));

CREATE POLICY "cabut suara" ON "public"."suara_post"
  FOR DELETE
  TO "authenticated"
  USING ((pengguna_id = auth.uid()));

CREATE POLICY "ubah suara" ON "public"."suara_post"
  FOR UPDATE
  TO "authenticated"
  USING ((pengguna_id = auth.uid()))
  WITH CHECK ((pengguna_id = auth.uid()));

REVOKE ALL ON TABLE "public"."suara_post" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_post" TO "postgres";
