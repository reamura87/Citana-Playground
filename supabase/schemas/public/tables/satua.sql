CREATE TABLE "public"."satua" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "slug"            text                     NOT NULL,
  "judul"           text                     NOT NULL,
  "kategori"        text                     NOT NULL DEFAULT 'Umum'::text,
  "isi"             text                     NOT NULL DEFAULT ''::text,
  "thumbnail_url"   text,
  "terbit"          boolean                  NOT NULL DEFAULT false,
  "dibuat_pada"     timestamp with time zone NOT NULL DEFAULT now(),
  "diperbarui_pada" timestamp with time zone NOT NULL DEFAULT now(),
  "jenis"           text                     NOT NULL DEFAULT 'resmi'::text,
  "penulis_id"      uuid,
  "penulis_nama"    text,
  "skor"            integer                  NOT NULL DEFAULT 0,
  "jumlah_komentar" integer                  NOT NULL DEFAULT 0,
  "selesai"         boolean                  NOT NULL DEFAULT false,
  "selesai_pada"    timestamp with time zone,
  CONSTRAINT "satua_isi_panjang" CHECK ((char_length(isi) <= 200000)),
  CONSTRAINT "satua_jenis_check" CHECK ((jenis = ANY (ARRAY['resmi'::text, 'cerpen'::text, 'serial'::text]))),
  CONSTRAINT "satua_judul_panjang" CHECK (((char_length(judul) >= 1) AND (char_length(judul) <= 150))),
  CONSTRAINT "satua_kategori_panjang" CHECK (((char_length(kategori) >= 1) AND (char_length(kategori) <= 40))),
  CONSTRAINT "satua_penulis_id_fkey" FOREIGN KEY (penulis_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "satua_pkey" PRIMARY KEY (id),
  CONSTRAINT "satua_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."satua"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX satua_jenis_diperbarui_pada_idx ON public.satua USING btree (jenis, diperbarui_pada DESC);

CREATE INDEX satua_selesai_idx ON public.satua USING btree (selesai_pada DESC)
  WHERE (selesai AND terbit);

CREATE TRIGGER satua_catat_selesai
  BEFORE INSERT OR UPDATE ON public.satua
  FOR EACH ROW
  EXECUTE FUNCTION public.catat_selesai_satua();

CREATE TRIGGER satua_isi_penulis
  BEFORE INSERT ON public.satua
  FOR EACH ROW
  EXECUTE FUNCTION public.isi_penulis_satua();

CREATE TRIGGER satua_kunci
  BEFORE UPDATE ON public.satua
  FOR EACH ROW
  EXECUTE FUNCTION public.kunci_satua();

CREATE TRIGGER satua_tolak_spam
  BEFORE INSERT OR UPDATE ON public.satua
  FOR EACH ROW
  EXECUTE FUNCTION public.tolak_spam_html();

CREATE POLICY "admin baca resmi" ON "public"."satua"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_admin() AND (jenis = 'resmi'::text)));

CREATE POLICY "admin hapus satua" ON "public"."satua"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "admin tambah resmi" ON "public"."satua"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((public.is_admin() AND (jenis = 'resmi'::text)));

CREATE POLICY "admin ubah resmi" ON "public"."satua"
  FOR UPDATE
  TO "authenticated"
  USING ((public.is_admin() AND (jenis = 'resmi'::text)))
  WITH CHECK ((public.is_admin() AND (jenis = 'resmi'::text)));

CREATE POLICY "anggota tambah tulisan" ON "public"."satua"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((penulis_id = auth.uid()) AND (jenis = ANY (ARRAY['cerpen'::text, 'serial'::text]))));

CREATE POLICY "penulis baca tulisannya" ON "public"."satua"
  FOR SELECT
  TO "authenticated"
  USING ((penulis_id = auth.uid()));

CREATE POLICY "penulis hapus tulisannya" ON "public"."satua"
  FOR DELETE
  TO "authenticated"
  USING (((penulis_id = auth.uid()) AND (jenis = ANY (ARRAY['cerpen'::text, 'serial'::text]))));

CREATE POLICY "penulis ubah tulisannya" ON "public"."satua"
  FOR UPDATE
  TO "authenticated"
  USING (((penulis_id = auth.uid()) AND (jenis = ANY (ARRAY['cerpen'::text, 'serial'::text]))))
  WITH CHECK (((penulis_id = auth.uid()) AND (jenis = ANY (ARRAY['cerpen'::text, 'serial'::text]))));

CREATE POLICY "publik baca yang terbit" ON "public"."satua"
  FOR SELECT
  TO "anon", "authenticated"
  USING (terbit);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."satua" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."satua" TO "service_role";

REVOKE ALL ON TABLE "public"."satua" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."satua" TO "postgres";
