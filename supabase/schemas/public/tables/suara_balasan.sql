CREATE TABLE "public"."suara_balasan" (
  "balasan_id"  uuid     NOT NULL,
  "nilai"       smallint NOT NULL,
  CONSTRAINT "suara_balasan_balasan_id_fkey" FOREIGN KEY (balasan_id) REFERENCES public.forum_balasan(id) ON DELETE CASCADE,
  CONSTRAINT "suara_balasan_nilai_check" CHECK ((nilai = ANY (ARRAY[1, '-1'::integer]))),
  "pengguna_id" uuid     NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "suara_balasan_pengguna_id_fkey" FOREIGN KEY (pengguna_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "suara_balasan_pkey" PRIMARY KEY (balasan_id, pengguna_id)
);

ALTER TABLE "public"."suara_balasan"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER suara_balasan_skor
  AFTER INSERT OR DELETE OR UPDATE ON public.suara_balasan
  FOR EACH ROW
  EXECUTE FUNCTION public.skor_balasan();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_balasan" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_balasan" TO "service_role";

CREATE POLICY "baca suara balasan sendiri" ON "public"."suara_balasan"
  FOR SELECT
  TO "authenticated"
  USING ((pengguna_id = auth.uid()));

CREATE POLICY "beri suara balasan" ON "public"."suara_balasan"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((pengguna_id = auth.uid()));

CREATE POLICY "cabut suara balasan" ON "public"."suara_balasan"
  FOR DELETE
  TO "authenticated"
  USING ((pengguna_id = auth.uid()));

CREATE POLICY "ubah suara balasan" ON "public"."suara_balasan"
  FOR UPDATE
  TO "authenticated"
  USING ((pengguna_id = auth.uid()))
  WITH CHECK ((pengguna_id = auth.uid()));

REVOKE ALL ON TABLE "public"."suara_balasan" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."suara_balasan" TO "postgres";
