CREATE TABLE "public"."suara_seni_rupa" (
  "karya_id"    uuid NOT NULL,
  CONSTRAINT "suara_seni_rupa_karya_id_fkey" FOREIGN KEY (karya_id) REFERENCES public.seni_rupa(id) ON DELETE CASCADE,
  "pengguna_id" uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "suara_seni_rupa_pengguna_id_fkey" FOREIGN KEY (pengguna_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "suara_seni_rupa_pkey" PRIMARY KEY (karya_id, pengguna_id)
);

ALTER TABLE "public"."suara_seni_rupa"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER suara_karya_hitung
  AFTER INSERT OR DELETE ON public.suara_seni_rupa
  FOR EACH ROW
  EXECUTE FUNCTION public.hitung_suara_karya();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_seni_rupa" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_seni_rupa" TO "service_role";

CREATE POLICY "baca upvote karya sendiri" ON "public"."suara_seni_rupa"
  FOR SELECT
  TO "authenticated"
  USING ((pengguna_id = auth.uid()));

CREATE POLICY "beri upvote karya" ON "public"."suara_seni_rupa"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((pengguna_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.seni_rupa r
  WHERE ((r.id = suara_seni_rupa.karya_id) AND (r.pembuat_id <> auth.uid()))))));

CREATE POLICY "cabut upvote karya" ON "public"."suara_seni_rupa"
  FOR DELETE
  TO "authenticated"
  USING ((pengguna_id = auth.uid()));

REVOKE ALL ON TABLE "public"."suara_seni_rupa" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_seni_rupa" TO "postgres";
