CREATE TABLE "public"."komentar_satua" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "satua_id"     uuid,
  "episode_id"   uuid,
  "penulis_nama" text                     NOT NULL,
  "isi"          text                     NOT NULL,
  "dibuat_pada"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "komentar_satua_check" CHECK (((satua_id IS NOT NULL) <> (episode_id IS NOT NULL))),
  CONSTRAINT "komentar_satua_isi_check" CHECK (((char_length(isi) >= 1) AND (char_length(isi) <= 1000))),
  CONSTRAINT "komentar_satua_pkey" PRIMARY KEY (id),
  CONSTRAINT "komentar_satua_satua_id_fkey" FOREIGN KEY (satua_id) REFERENCES public.satua(id) ON DELETE CASCADE,
  CONSTRAINT "komentar_satua_episode_id_fkey" FOREIGN KEY (episode_id) REFERENCES public.satua_episode(id) ON DELETE CASCADE,
  "penulis_id"   uuid                     NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "komentar_satua_penulis_id_fkey" FOREIGN KEY (penulis_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."komentar_satua"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX komentar_satua_episode_id_dibuat_pada_idx ON public.komentar_satua USING btree (episode_id, dibuat_pada);

CREATE INDEX komentar_satua_satua_id_dibuat_pada_idx ON public.komentar_satua USING btree (satua_id, dibuat_pada);

CREATE TRIGGER komentar_hitung
  AFTER INSERT OR DELETE ON public.komentar_satua
  FOR EACH ROW
  EXECUTE FUNCTION public.hitung_komentar();

CREATE TRIGGER komentar_isi
  BEFORE INSERT ON public.komentar_satua
  FOR EACH ROW
  EXECUTE FUNCTION public.isi_komentar();

CREATE TRIGGER komentar_satua_tolak_spam
  BEFORE INSERT ON public.komentar_satua
  FOR EACH ROW
  EXECUTE FUNCTION public.tolak_spam_teks();

CREATE POLICY "publik baca komentar" ON "public"."komentar_satua"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."komentar_satua" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."komentar_satua" TO "service_role";

CREATE POLICY "anggota berkomentar" ON "public"."komentar_satua"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((penulis_id = auth.uid()) AND (((satua_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.satua s
  WHERE ((s.id = komentar_satua.satua_id) AND (s.jenis = 'cerpen'::text) AND s.terbit)))) OR ((episode_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (public.satua_episode e
     JOIN public.satua s ON ((s.id = e.satua_id)))
  WHERE ((e.id = komentar_satua.episode_id) AND e.terbit AND s.terbit AND (s.jenis = 'serial'::text))))))));

CREATE POLICY "hapus komentar" ON "public"."komentar_satua"
  FOR DELETE
  TO "authenticated"
  USING (((penulis_id = auth.uid()) OR public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.satua s
  WHERE ((s.id = komentar_satua.satua_id) AND (s.penulis_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.satua_episode e
     JOIN public.satua s ON ((s.id = e.satua_id)))
  WHERE ((e.id = komentar_satua.episode_id) AND (s.penulis_id = auth.uid()))))));

REVOKE ALL ON TABLE "public"."komentar_satua" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."komentar_satua" TO "postgres";
