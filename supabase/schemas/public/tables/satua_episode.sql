CREATE TABLE "public"."satua_episode" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "satua_id"        uuid                     NOT NULL,
  "nomor"           integer                  NOT NULL,
  "judul"           text                     NOT NULL,
  "isi"             text                     NOT NULL DEFAULT ''::text,
  "terbit"          boolean                  NOT NULL DEFAULT false,
  "skor"            integer                  NOT NULL DEFAULT 0,
  "jumlah_komentar" integer                  NOT NULL DEFAULT 0,
  "dibuat_pada"     timestamp with time zone NOT NULL DEFAULT now(),
  "diperbarui_pada" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "satua_episode_isi_check" CHECK ((char_length(isi) <= 200000)),
  CONSTRAINT "satua_episode_judul_check" CHECK (((char_length(judul) >= 1) AND (char_length(judul) <= 150))),
  CONSTRAINT "satua_episode_pkey" PRIMARY KEY (id),
  CONSTRAINT "satua_episode_satua_id_fkey" FOREIGN KEY (satua_id) REFERENCES public.satua(id) ON DELETE CASCADE,
  CONSTRAINT "satua_episode_satua_id_nomor_key" UNIQUE (satua_id, nomor)
);

ALTER TABLE "public"."satua_episode"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER episode_isi
  BEFORE INSERT ON public.satua_episode
  FOR EACH ROW
  EXECUTE FUNCTION public.isi_episode();

CREATE TRIGGER episode_kunci
  BEFORE UPDATE ON public.satua_episode
  FOR EACH ROW
  EXECUTE FUNCTION public.kunci_episode();

CREATE TRIGGER episode_naikkan
  AFTER INSERT OR UPDATE OF terbit, judul, isi ON public.satua_episode
  FOR EACH ROW
  EXECUTE FUNCTION public.naikkan_serial();

CREATE TRIGGER episode_tolak_spam
  BEFORE INSERT OR UPDATE ON public.satua_episode
  FOR EACH ROW
  EXECUTE FUNCTION public.tolak_spam_html();

CREATE POLICY "penulis atau admin hapus episode" ON "public"."satua_episode"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.satua s
  WHERE ((s.id = satua_episode.satua_id) AND ((s.penulis_id = auth.uid()) OR public.is_admin())))));

CREATE POLICY "penulis baca semua episodenya" ON "public"."satua_episode"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.satua s
  WHERE ((s.id = satua_episode.satua_id) AND (s.penulis_id = auth.uid())))));

CREATE POLICY "penulis tambah episode" ON "public"."satua_episode"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.satua s
  WHERE ((s.id = satua_episode.satua_id) AND (s.penulis_id = auth.uid()) AND (s.jenis = 'serial'::text)))));

CREATE POLICY "penulis ubah episode" ON "public"."satua_episode"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.satua s
  WHERE ((s.id = satua_episode.satua_id) AND (s.penulis_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.satua s
  WHERE ((s.id = satua_episode.satua_id) AND (s.penulis_id = auth.uid())))));

CREATE POLICY "publik baca episode terbit" ON "public"."satua_episode"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((terbit AND (EXISTS ( SELECT 1
   FROM public.satua s
  WHERE ((s.id = satua_episode.satua_id) AND s.terbit)))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."satua_episode" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."satua_episode" TO "service_role";

REVOKE ALL ON TABLE "public"."satua_episode" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."satua_episode" TO "postgres";
