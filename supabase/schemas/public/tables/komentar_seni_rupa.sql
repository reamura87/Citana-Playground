CREATE TABLE "public"."komentar_seni_rupa" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "karya_id"     uuid                     NOT NULL,
  "penulis_nama" text                     NOT NULL,
  "isi"          text                     NOT NULL,
  "dibuat_pada"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "komentar_seni_rupa_isi_check" CHECK (((char_length(isi) >= 1) AND (char_length(isi) <= 1000))),
  CONSTRAINT "komentar_seni_rupa_pkey" PRIMARY KEY (id),
  CONSTRAINT "komentar_seni_rupa_karya_id_fkey" FOREIGN KEY (karya_id) REFERENCES public.seni_rupa(id) ON DELETE CASCADE,
  "penulis_id"   uuid                     NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "komentar_seni_rupa_penulis_id_fkey" FOREIGN KEY (penulis_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."komentar_seni_rupa"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX komentar_seni_rupa_karya_id_dibuat_pada_idx ON public.komentar_seni_rupa USING btree (karya_id, dibuat_pada);

CREATE TRIGGER komentar_karya_hitung
  AFTER INSERT OR DELETE ON public.komentar_seni_rupa
  FOR EACH ROW
  EXECUTE FUNCTION public.hitung_komentar_karya();

CREATE TRIGGER komentar_karya_isi
  BEFORE INSERT ON public.komentar_seni_rupa
  FOR EACH ROW
  EXECUTE FUNCTION public.isi_komentar_karya();

CREATE TRIGGER komentar_karya_tolak_spam
  BEFORE INSERT ON public.komentar_seni_rupa
  FOR EACH ROW
  EXECUTE FUNCTION public.tolak_spam_teks();

CREATE POLICY "publik baca komentar karya" ON "public"."komentar_seni_rupa"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."komentar_seni_rupa" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."komentar_seni_rupa" TO "service_role";

CREATE POLICY "anggota komentari karya" ON "public"."komentar_seni_rupa"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((penulis_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.seni_rupa r
  WHERE (r.id = komentar_seni_rupa.karya_id)))));

CREATE POLICY "hapus komentar karya" ON "public"."komentar_seni_rupa"
  FOR DELETE
  TO "authenticated"
  USING (((penulis_id = auth.uid()) OR public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.seni_rupa r
  WHERE ((r.id = komentar_seni_rupa.karya_id) AND (r.pembuat_id = auth.uid()))))));

REVOKE ALL ON TABLE "public"."komentar_seni_rupa" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."komentar_seni_rupa" TO "postgres";
