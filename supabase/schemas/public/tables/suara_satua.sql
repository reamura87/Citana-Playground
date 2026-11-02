CREATE TABLE "public"."suara_satua" (
  "satua_id"    uuid NOT NULL,
  CONSTRAINT "suara_satua_satua_id_fkey" FOREIGN KEY (satua_id) REFERENCES public.satua(id) ON DELETE CASCADE,
  "pengguna_id" uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "suara_satua_pengguna_id_fkey" FOREIGN KEY (pengguna_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "suara_satua_pkey" PRIMARY KEY (satua_id, pengguna_id)
);

ALTER TABLE "public"."suara_satua"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER suara_satua_hitung
  AFTER INSERT OR DELETE ON public.suara_satua
  FOR EACH ROW
  EXECUTE FUNCTION public.hitung_suara_satua();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_satua" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_satua" TO "service_role";

CREATE POLICY "baca upvote sendiri" ON "public"."suara_satua"
  FOR SELECT
  TO "authenticated"
  USING ((pengguna_id = auth.uid()));

CREATE POLICY "beri upvote" ON "public"."suara_satua"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((pengguna_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.satua s
  WHERE ((s.id = suara_satua.satua_id) AND (s.jenis = 'cerpen'::text) AND s.terbit AND (s.penulis_id <> auth.uid()))))));

CREATE POLICY "cabut upvote" ON "public"."suara_satua"
  FOR DELETE
  TO "authenticated"
  USING ((pengguna_id = auth.uid()));

REVOKE ALL ON TABLE "public"."suara_satua" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_satua" TO "postgres";
