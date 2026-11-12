CREATE TABLE "public"."forum_post" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "penulis_nama"   text                     NOT NULL,
  "isi"            text                     NOT NULL,
  "gambar_url"     text,
  "skor"           integer                  NOT NULL DEFAULT 0,
  "jumlah_balasan" integer                  NOT NULL DEFAULT 0,
  "dibuat_pada"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "forum_post_isi_check" CHECK (((char_length(isi) >= 1) AND (char_length(isi) <= 1000))),
  CONSTRAINT "forum_post_pkey" PRIMARY KEY (id),
  "penulis_id"     uuid                     NOT NULL DEFAULT auth.uid(),
  CONSTRAINT "forum_post_penulis_id_fkey" FOREIGN KEY (penulis_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."forum_post"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX forum_post_dibuat_pada_idx ON public.forum_post USING btree (dibuat_pada DESC);

CREATE INDEX forum_post_skor_idx ON public.forum_post USING btree (skor DESC);

CREATE TRIGGER forum_post_tolak_spam
  BEFORE INSERT ON public.forum_post
  FOR EACH ROW
  EXECUTE FUNCTION public.tolak_spam_teks();

CREATE TRIGGER post_isi_penulis
  BEFORE INSERT ON public.forum_post
  FOR EACH ROW
  EXECUTE FUNCTION public.isi_penulis();

CREATE TRIGGER post_notifikasi
  AFTER INSERT ON public.forum_post
  FOR EACH ROW
  EXECUTE FUNCTION public.buat_notifikasi_post();

CREATE POLICY "publik baca post" ON "public"."forum_post"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."forum_post" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."forum_post" TO "service_role";

CREATE POLICY "anggota tulis post" ON "public"."forum_post"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((penulis_id = auth.uid()));

CREATE POLICY "hapus post sendiri atau admin" ON "public"."forum_post"
  FOR DELETE
  TO "authenticated"
  USING (((penulis_id = auth.uid()) OR public.is_admin()));

REVOKE ALL ON TABLE "public"."forum_post" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."forum_post" TO "postgres";
